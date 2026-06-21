// 여기에 복사해둔 구글 웹 앱 URL을 넣습니다.
const APPS_SCRIPT_WEB_APP_URL = "https://script.google.com/macros/s/AKfycbzBLXnbe832dMh3_E5mKkOIILcDh0esBsuLlpft4Coy9CwBdak7NmCt9Mu8GXySnpCw/exec";

function saveApiKey() {
    const key = document.getElementById('api-key').value.trim();
    if (key) { localStorage.setItem('gemini_api_key', key); document.getElementById('key-status').innerText = "✅ 저장됨"; }
}

async function savePassageToDB() {
    const content = document.getElementById('new-passage').value.trim();
    if (!content) return alert("지문을 입력하세요.");
    document.getElementById('save-status').innerText = "저장 중...";
    await fetch(APPS_SCRIPT_WEB_APP_URL, { method: 'POST', body: JSON.stringify({ content: content }) });
    document.getElementById('save-status').innerText = "✅ 완료!";
    document.getElementById('new-passage').value = "";
    loadPassages();
}

async function loadPassages() {
    const listDiv = document.getElementById('passage-list');
    listDiv.innerHTML = "불러오는 중...";
    const response = await fetch(APPS_SCRIPT_WEB_APP_URL);
    const data = await response.json();
    listDiv.innerHTML = "";
    data.forEach((item, index) => {
        const preview = item.content.length > 50 ? item.content.substring(0, 50) + "..." : item.content;
        listDiv.innerHTML += `<div class="passage-item"><input type="checkbox" id="p-${index}" value="${item.content}"> <label for="p-${index}">[${new Date(item.date).toLocaleDateString()}] ${preview}</label></div>`;
    });
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

    for (let i = 0; i < checkboxes.length; i++) {
        const passage = checkboxes[i].value;
        const prompt = `고등학교 영어 교사로서 다음 지문을 바탕으로 수능/내신 스타일의 [${selectedType}] 문제 ${questionCount}문항을 출제해.
        조건: 한국어 발문, 1~5번 객관식 선지, 정답 및 해설 하단 분리 표기.
        지문: ${passage}`;

        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });
        const data = await res.json();
        if (data.candidates) finalExamText += `<h3>[Passage ${i + 1}]</h3>\n` + data.candidates[0].content.parts[0].text + `\n<hr>\n`;
    }
    
    outputContent.innerHTML = finalExamText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>');
    document.getElementById('loading-msg').style.display = "none";
}

function downloadPDF() {
    html2pdf().set({ margin: 10, filename: 'Exam_Paper.pdf', html2canvas: { scale: 2 }, jsPDF: { format: 'a4', orientation: 'portrait' } }).from(document.getElementById('exam-paper')).save();
}
