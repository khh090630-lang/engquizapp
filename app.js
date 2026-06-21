const APPS_SCRIPT_WEB_APP_URL = "https://script.google.com/macros/s/AKfycbzBLXnbe832dMh3_E5mKkOIILcDh0esBsuLlpft4Coy9CwBdak7NmCt9Mu8GXySnpCw/exec";

function saveApiKey() {
    const key = document.getElementById('api-key').value.trim();
    if (key) { 
        localStorage.setItem('gemini_api_key', key); 
        alert("API 키가 저장되었습니다."); 
        document.getElementById('key-status').innerText = "✅ 저장됨"; 
    }
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
    
    const outputContent = document.getElementById('output-content');
    document.getElementById('loading-msg').style.display = "block";
    outputContent.innerHTML = "";

    try {
        for (let i = 0; i < checkboxes.length; i++) {
            const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                method: 'POST', 
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}`, 'HTTP-Referer': 'https://khh090630-lang.github.io/engquizapp/', 'X-Title': 'English Quiz App' },
                body: JSON.stringify({ 
                    model: "openai/gpt-4o-mini", // 가장 확실한 모델 ID
                    messages: [{ role: "user", content: "지문: " + checkboxes[i].value + "\n문제 출제해줘." }] 
                })
            });
            const data = await res.json();
            if (data.choices) {
                outputContent.innerHTML += `<p>${data.choices[0].message.content.replace(/\n/g, '<br>')}</p><hr>`;
            } else {
                throw new Error(data.error?.message || "Unknown Error");
            }
        }
    } catch (e) {
        outputContent.innerHTML = "오류 발생: " + e.message;
    } finally {
        document.getElementById('loading-msg').style.display = "none";
    }
}
