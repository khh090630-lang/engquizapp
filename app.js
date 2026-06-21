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
            
            // 데이터가 정상적으로 도착했을 때
            if (data.candidates) {
                finalExamText += `<h3>[Passage ${i + 1}]</h3>\n` + data.candidates[0].content.parts[0].text + `\n<hr>\n`;
            } 
            // Gemini API가 에러 메시지를 보냈을 때 (화면에 빨간 글씨로 출력)
            else if (data.error) {
                finalExamText += `<p style='color:red;'><strong>API 오류 발생:</strong> ${data.error.message}</p>\n<hr>\n`;
                console.error("Gemini API Error:", data.error);
            }
        }
        
        outputContent.innerHTML = finalExamText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>');
    } catch (error) {
        outputContent.innerHTML = "<span style='color:red;'>네트워크 또는 시스템 오류가 발생했습니다.</span>";
        console.error(error);
    } finally {
        document.getElementById('loading-msg').style.display = "none";
    }
}
