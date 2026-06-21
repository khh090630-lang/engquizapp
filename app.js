const APPS_SCRIPT_WEB_APP_URL = "https://script.google.com/macros/s/AKfycbzBLXnbe832dMh3_E5mKkOIILcDh0esBsuLlpft4Coy9CwBdak7NmCt9Mu8GXySnpCw/exec";

// ... saveApiKey, savePassageToDB, loadPassages 함수는 기존과 동일 ...
function saveApiKey() {
    const key = document.getElementById('api-key').value.trim();
    if (key) { localStorage.setItem('gemini_api_key', key); alert("API 키가 저장되었습니다."); document.getElementById('key-status').innerText = "✅ 저장됨"; }
}

async function savePassageToDB() {
    const title = document.getElementById('passage-title').value.trim();
    const content = document.getElementById('new-passage').value.trim();
    if (!title || !content) return alert("제목과 지문을 모두 입력하세요.");
    document.getElementById('save-status').innerText = "저장 중...";
    try {
        await fetch(APPS_SCRIPT_WEB_APP_URL, { method: 'POST', body: JSON.stringify({ title: title, content: content }) });
        document.getElementById('save-status').innerText = "✅ 저장 완료!";
        loadPassages();
    } catch(e) { document.getElementById('save-status').innerText = "❌ 저장 실패"; }
}

async function loadPassages() {
    const listDiv = document.getElementById('passage-list');
    listDiv.innerHTML = "불러오는 중...";
    try {
        const response = await fetch(APPS_SCRIPT_WEB_APP_URL);
        const data = await response.json();
        listDiv.innerHTML = "";
        data.forEach((item, index) => {
            const displayTitle = item.title ? item.title : "제목없음";
            listDiv.innerHTML += `
            <div class="passage-item">
                <input type="checkbox" id="p-${index}" value="${item.content}"> 
                <label for="p-${index}"><strong>[${displayTitle}]</strong></label>
            </div>`;
        });
    } catch (e) { listDiv.innerHTML = "데이터 로드 실패"; }
}

async function generateExam() {
    const apiKey = localStorage.getItem('gemini_api_key');
    if (!apiKey) return alert("API 키를 먼저 저장하세요.");
    
    const checkboxes = document.querySelectorAll('#passage-list input[type="checkbox"]:checked');
    if (checkboxes.length === 0) return alert("지문을 선택하세요.");
    
    const selectedType = document.getElementById('question-type').value; // 예: 빈칸 추론, 순서 배열 등
    const outputContent = document.getElementById('output-content');
    
    document.getElementById('loading-msg').style.display = "block";
    outputContent.innerHTML = "";
    let finalExamText = "";

    try {
        for (let i = 0; i < checkboxes.length; i++) {
            const passage = checkboxes[i].value;
            
            // 프롬프트를 유형별 맞춤형으로 강화
            const prompt = `
            당신은 수능 영어 출제 위원입니다. 
            지문: "${passage}"
            
            요구사항:
            1. 유형: ${selectedType}
            2. 문제 형식: 반드시 아래 [형식]을 엄격히 준수할 것.
            
            [형식]
            [지문]
            ${passage}
            
            [문제]
            (여기에 ${selectedType} 유형에 맞는 수능형 5지선다 문제를 작성하라)
            ① 
            ② 
            ③ 
            ④ 
            ⑤ 
            
            [정답 및 해설]
            정답: 
            해설: 
            
            주의: 잡담, 인사, "문제입니다"와 같은 문구 절대 금지. 
            만약 '순서 배열' 유형이라면 (A), (B), (C)로 나누어 제시할 것. 
            만약 '빈칸 추론' 유형이라면 지문에 빈칸(____)을 뚫을 것.
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

function downloadPDF() {
    html2pdf().set({ margin: 10, filename: 'Exam_Paper.pdf' }).from(document.getElementById('exam-paper')).save();
}

console.log("app.js 로드 성공!");
