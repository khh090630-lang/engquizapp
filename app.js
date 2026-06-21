// 알려주신 구글 웹 앱 URL이 그대로 적용되어 있습니다.
const APPS_SCRIPT_WEB_APP_URL = "https://script.google.com/macros/s/AKfycbzBLXnbe832dMh3_E5mKkOIILcDh0esBsuLlpft4Coy9CwBdak7NmCt9Mu8GXySnpCw/exec";

function saveApiKey() {
    const key = document.getElementById('api-key').value.trim();
    if (key) { 
        localStorage.setItem('gemini_api_key', key); 
        document.getElementById('key-status').innerText = "✅ 저장됨"; 
    }
}

// 창을 열었을 때 키가 있으면 표시해주는 기능 유지
window.onload = function() {
    if (localStorage.getItem('gemini_api_key')) {
        document.getElementById('key-status').innerText = "✅ API 키 저장됨";
    }
}

// DB에 제목과 지문을 함께 저장하도록 수정
async function savePassageToDB() {
    const title = document.getElementById('passage-title').value.trim();
    const content = document.getElementById('new-passage').value.trim();
    
    if (!title) return alert("지문 이름을 입력하세요.");
    if (!content) return alert("지문을 입력하세요.");
    
    document.getElementById('save-status').innerText = "저장 중...";
    try {
        await fetch(APPS_SCRIPT_WEB_APP_URL, { 
            method: 'POST', 
            body: JSON.stringify({ title: title, content: content }) 
        });
        document.getElementById('save-status').innerText = "✅ 완료!";
        document.getElementById('passage-title').value = ""; // 입력 성공 시 칸 비우기
        document.getElementById('new-passage').value = "";
        loadPassages();
    } catch (error) {
        document.getElementById('save-status').innerText = "❌ 오류 발생";
        console.error(error);
    }
}

// DB에서 불러올 때 제목을 표시하도록 수정
async function loadPassages() {
    const listDiv = document.getElementById('passage-list');
    listDiv.innerHTML = "불러오는 중...";
    try {
        const response = await fetch(APPS_SCRIPT_WEB_APP_URL);
        const data = await response.json();
        listDiv.innerHTML = "";
        
        data.forEach((item, index) => {
            const preview = item.content.length > 30 ? item.content.substring(0, 30) + "..." : item.content;
            // 예전 데이터(제목이 없는 데이터)를 위한 방어 코드 포함
            const displayTitle = item.title ? item.title : new Date(item.date).toLocaleDateString();
            
            listDiv.innerHTML += `
            <div class="passage-item">
                <input type="checkbox" id="p-${index}" value="${item.content}"> 
                <label for="p-${index}">
                    <strong>[${displayTitle}]</strong> <span style="font-size: 0.9em; color: #666;">${preview}</span>
                </label>
            </div>`;
        });
    } catch (error) {
        listDiv.innerHTML = "데이터를 불러오지 못했습니다.";
        console.error(error);
    }
}

function segmentText(text) {
    const segmenter = new Intl.Segmenter('en', { granularity: 'sentence' });
    return Array.from(segmenter.segment(text)).map(s => s.segment.trim()).filter(s => s.length > 0);
}

async function generateExam() {
    const apiKey = localStorage.getItem('gemini_api_key');
    if (!apiKey) return alert("API 키를 저장하세요.");
    
    const checkboxes = document.querySelectorAll('#passage-list input[type="checkbox"]:checked');
    if (checkboxes.length === 0) return alert("지문을 선택하세요.");
    
    const selectedType = document.getElementById('question-type').value;
    const questionCount = document.getElementById('question-count').value;
    const outputContent = document.getElementById('output-content');
    
    document.getElementById('loading-msg').style.display = "block";
    outputContent.innerHTML = "";
    let finalExamText = `<h2>Mock Examination</h2>\n\n`;

    try {
        for (let i = 0; i < checkboxes.length; i++) {
            const passage = checkboxes[i].value;
            const prompt = `고등학교 영어 교사로서 다음 지문을 바탕으로 수능/내신 스타일의 [${selectedType}] 문제 ${questionCount}문항을 출제해.
            조건: 한국어 발문, 1~5번 객관식 선지, 정답 및 해설 하단 분리 표기.
            지문: ${passage}`;

            const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
                method: 'POST', 
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
            });
            const data = await res.json();
            if (data.candidates) {
                finalExamText += `<h3>[Passage ${i + 1}]</h3>\n` + data.candidates[0].content.parts[0].text + `\n<hr>\n`;
            }
        }
        
        outputContent.innerHTML = finalExamText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>');
    } catch (error) {
        outputContent.innerHTML = "<span style='color:red;'>오류가 발생했습니다. 개발자 도구를 확인하세요.</span>";
        console.error(error);
    } finally {
        document.getElementById('loading-msg').style.display = "none";
    }
}

function downloadPDF() {
    html2pdf().set({ 
        margin: 10, 
        filename: 'Exam_Paper.pdf', 
        html2canvas: { scale: 2 }, 
        jsPDF: { format: 'a4', orientation: 'portrait' } 
    }).from(document.getElementById('exam-paper')).save();
}
