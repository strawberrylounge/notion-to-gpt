// Vercel에서 사용할 API 엔드포인트
// /api/notion-content.js 파일로 저장

export default async function handler(req, res) {
  // CORS 헤더 설정
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    const NOTION_TOKEN = process.env.NOTION_TOKEN; // Vercel 환경변수에 설정
    const PAGE_ID = "2498a22e66db80ffb4cacbca00c8de28"; // 여러분의 페이지 ID

    // Notion API로 페이지 블록들 가져오기
    const response = await fetch(
      `https://api.notion.com/v1/blocks/${PAGE_ID}/children?page_size=100`,
      {
        headers: {
          Authorization: `Bearer ${NOTION_TOKEN}`,
          "Notion-Version": "2022-06-28",
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Notion API 오류: ${response.status}`);
    }

    const data = await response.json();

    // 블록들을 텍스트로 변환
    let content = "";

    for (const block of data.results) {
      content += extractTextFromBlock(block) + "\n";
    }

    // GPT에게 전달할 깔끔한 JSON
    const result = {
      title: "꿈과 무의식이 상징하는 다음 인연",
      content: content.trim(),
      updated: new Date().toISOString(),
      source: "notion",
    };

    return res.status(200).json(result);
  } catch (error) {
    console.error("오류:", error);
    return res.status(500).json({
      error: "페이지를 가져올 수 없습니다",
      details: error.message,
    });
  }
}

// 블록에서 텍스트 추출하는 함수
function extractTextFromBlock(block) {
  let text = "";

  switch (block.type) {
    case "paragraph":
      text = extractRichText(block.paragraph.rich_text);
      break;
    case "heading_1":
      text = "# " + extractRichText(block.heading_1.rich_text);
      break;
    case "heading_2":
      text = "## " + extractRichText(block.heading_2.rich_text);
      break;
    case "heading_3":
      text = "### " + extractRichText(block.heading_3.rich_text);
      break;
    case "bulleted_list_item":
      text = "• " + extractRichText(block.bulleted_list_item.rich_text);
      break;
    case "numbered_list_item":
      text = "1. " + extractRichText(block.numbered_list_item.rich_text);
      break;
    case "quote":
      text = "> " + extractRichText(block.quote.rich_text);
      break;
    case "code":
      text = "```\n" + extractRichText(block.code.rich_text) + "\n```";
      break;
    case "divider":
      text = "---";
      break;
    default:
      // 다른 블록 타입들도 텍스트가 있으면 추출
      if (block[block.type] && block[block.type].rich_text) {
        text = extractRichText(block[block.type].rich_text);
      }
  }

  return text;
}

// Rich text에서 순수 텍스트 추출
function extractRichText(richTextArray) {
  if (!richTextArray || !Array.isArray(richTextArray)) {
    return "";
  }

  return richTextArray
    .map((item) => (item.text ? item.text.content : ""))
    .join("");
}
