const APPS_SCRIPT_WEB_APP_URL = "https://script.google.com/macros/s/AKfycbzBLXnbe832dMh3_E5mKkOIILcDh0esBsuLlpft4Coy9CwBdak7NmCt9Mu8GXySnpCw/exec";

function saveApiKey() {
    const key = document.getElementById('api-key').value.trim();
    if (key) { localStorage.setItem('gemini_api_key', key); alert("API 키가 저장되었습니다."); document.getElementById('key-status').innerText = "✅ 저장됨"; }
}

async function loadPassages() {
    const listDiv = document.getElementById('passage-list');
    listDiv.innerHTML = "불러오는 중...";
    try {
        const response = await fetch(APPS_SCRIPT_WEB_APP_URL);
        const data = await response.json();
        listDiv.innerHTML = "";
        data.forEach((item, index) => {
            listDiv.innerHTML += `
            <div class="passage-item">
                <input type="checkbox" id="p-${index}" value="${item.content}"> 
                <label for="p-${index}"><strong>[${item.title || "제목없음"}]</strong></label>
            </div>`;
        });
    } catch (e) { listDiv.innerHTML = "데이터 로드 실패"; }
}

async function generateExam() {
    const apiKey = localStorage.getItem('gemini_api_key');
    if (!apiKey) return alert("API 키를 먼저 저장하세요.");
    
    const checkboxes = document.querySelectorAll('#passage-list input[type="checkbox"]:checked');
    if (checkboxes.length === 0) return alert("지문을 선택하세요.");
    
    const selectedType = document.getElementById('question-type').value;
    const outputContent = document.getElementById('output-content');
    
    document.getElementById('loading-msg').style.display = "block";
    outputContent.innerHTML = "";
    let finalExamText = "";

    try {
        for (let i = 0; i < checkboxes.length; i++) {
            const passage = checkboxes[i].value;
            
            // 핵심 프롬프트: 지문 통째로 출력 금지 및 유형별 변형 강제
            const prompt = `
            수능 영어 출제 위원으로서 다음 지문을 '${selectedType}' 유형의 문제로 변형하세요.
            
            [절대 준수 규칙]
            1. 지문 전체를 그대로 복사하지 마세요. 반드시 아래 유형별 변형 규칙을 따르세요.
               - 빈칸 추론: 정답이 될 핵심 문장에 '____' 빈칸을 뚫으세요.
               - 순서 배열: 지문을 (A), (B), (C)로 나누고 순서를 섞으세요.
               - 나머지 유형: 지문을 문제 풀이에 적합한 형태로 변형하세요.
            2. 아래 [형식]만 출력하세요. 인삿말 절대 금지.
            
            [형식]
            [지문]
            (위 규칙에 따라 변형된 지문만 제시)
            
            [문제]
            (5지선다 문제)
            
            [정답 및 해설]
            정답: 
            해설: 
            
            [원본 지문]
            ${passage}
            `;

            const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                method: 'POST', 
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`,
                    'HTTP-Referer': 'https://khh090630-lang.github.io/engquizapp/',
                    'X-Title': 'English Quiz App'
                },
                body: JSON.stringify({ 
                    model: "openai/gpt-4o-mini",
                    messages: [{ role: "user", content: prompt }] 
                })
            });
            const data = await res.json();
            
            if (data.choices && data.choices[0].message) {
                const text = data.choices[0].message.content;
                finalExamText += text.replace(/\n/g, '<br>') + '<br><br><hr><br>';
            }
        }
        outputContent.innerHTML = finalExamText;
    } catch (e) {
        outputContent.innerHTML = "네트워크 오류 발생!";
    } finally {
        document.getElementById('loading-msg').style.display = "none";
    }
}

console.log("app.js 로드 성공!");
