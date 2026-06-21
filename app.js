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
    let finalExamText = "";

    try {
        for (let i = 0; i < checkboxes.length; i++) {
            const passage = checkboxes[i].value;
            
            // 핵심 수정: 프롬프트에서 '시험지 형식'과 '문제 유형별 변형'을 강제함
            const prompt = `
            당신은 수능 영어 출제 위원입니다. 아래 지문을 사용하여 '${selectedType}' 유형의 문제를 출제하세요.
            
            [지시사항]
            1. [지문] 영역: 
               - 빈칸 추론 유형이라면 정답이 들어갈 부분을 '____'로 처리하여 출력하세요. (지문 전체를 제시하되 그 지문 전체에서 문제로 낼 빈칸 부분만 ____으로 처리해서 제시하세요.)
               - 순서 배열 유형이라면 (A), (B), (C)로 나누어 순서를 섞으세요.
               - 나머지 유형도 수능 시험지처럼 편집해서 출력하세요.
            2. [문제] 영역: 5지선다 문항 작성.
            3. [정답 및 해설] 영역: 정답과 간단한 해설 작성.
            4. 잡담, 인사, "다음은 지문입니다" 같은 문구 절대 금지.
            
            [지문 원본]
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
            만약 '순서 배열' 유형이라면 지문을 (A), (B), (C)로 나누어 제시하고 선지는 (A)-(C)-(B) 이런식으로 순서를 맞추도록 내줄 것. 
            만약 '빈칸 추론' 유형이라면 지문에 빈칸(____)을 뚫고 그 빈칸에 들어갈 내용을 정답으로 선지에서 제시하고 나머지 네 개의 선지는 헷갈릴만한 빈칸에 들어가기에 문맥상 어색한 문장을 제시할 것.
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
