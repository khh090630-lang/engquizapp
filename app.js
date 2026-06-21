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
        await fetch(APPS_SCRIPT_WEB_APP_URL, { 
            method: 'POST', 
            body: JSON.stringify({ title: title, content: content }) 
        });
        document.getElementById('save-status').innerText = "✅ 저장 완료!";
        document.getElementById('passage-title').value = "";
        document.getElementById('new-passage').value = "";
        loadPassages();
    } catch(e) {
        document.getElementById('save-status').innerText = "❌ 저장 실패";
    }
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
    } catch (e) {
        listDiv.innerHTML = "데이터 로드 실패";
    }
}

async function generateExam() {
    const apiKey = localStorage.getItem('gemini_api_key');
    if (!apiKey) return alert("API 키를 먼저 저장하세요.");
    
    const checkboxes = document.querySelectorAll('#passage-list input[type="checkbox"]:checked');
    if (checkboxes.length === 0) return alert("지문을 선택하세요.");
    
    const selectedType = document.getElementById('question-type').value;
    const questionCount = document.getElementById('question-count').value;
    const outputContent = document.getElementById('output-content');
    
    document.getElementById('loading-msg').style.display = "block";
    outputContent.innerHTML = "";
    let finalExamText = "";

    try {
        for (let i = 0; i < checkboxes.length; i++) {
            const passage = checkboxes[i].value;
            
            // 프롬프트를 유형과 개수를 강제하도록 수정
            const prompt = `
            당신은 수능 영어 출제 위원입니다. 아래 지문을 읽고 '${selectedType}' 유형의 문제를 정확히 ${questionCount}문항 출제하세요.
            
            [지시사항]
            1. 유형: ${selectedType}
            2. 개수: 정확히 ${questionCount}문항
            3. 잡담 금지. 인사 금지. 오직 아래 형식으로만 출력.
            
            [형식]
            [지문]
            (지문 내용)
            
            [문제]
            (문제 문항 1~${questionCount}번까지)
            
            [정답 및 해설]
            정답: 
            해설: 
            
            [지문]
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

function downloadPDF() {
    html2pdf().set({ margin: 10, filename: 'Exam_Paper.pdf' }).from(document.getElementById('exam-paper')).save();
}

console.log("app.js 로드 성공!");
