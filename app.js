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
            // 프롬프트 구성
            const prompt = `고등학교 영어 교사로서 다음 지문을 바탕으로 수능/내신 스타일의 [${selectedType}] 문제 ${questionCount}문항을 출제해.
            조건: 한국어 발문, 1~5번 객관식 선지, 정답 및 해설 하단 분리 표기.
            지문: ${passage}`;

            // API 호출 (가장 표준적인 경로)
            const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
                method: 'POST', 
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    contents: [{ parts: [{ text: prompt }] }] 
                })
            });
            
            const data = await res.json();
            
            // 응답 처리
            if (data.candidates && data.candidates[0].content) {
                const generatedText = data.candidates[0].content.parts[0].text;
                finalExamText += `<h3>[Passage ${i + 1}]</h3>\n` + generatedText + `\n<hr>\n`;
            } 
            // 에러 발생 시 처리
            else if (data.error) {
                finalExamText += `<p style='color:red;'><strong>API 오류 (${data.error.code}):</strong> ${data.error.message}</p>\n<hr>\n`;
                console.error("Gemini API Error:", data.error);
            } else {
                finalExamText += `<p style='color:red;'><strong>알 수 없는 응답 오류가 발생했습니다.</strong></p>\n<hr>\n`;
            }
        }
        
        // 결과 표시 (마크다운 포맷팅 적용)
        outputContent.innerHTML = finalExamText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>');
        
    } catch (error) {
        outputContent.innerHTML = "<span style='color:red;'>네트워크 연결에 실패했습니다. 다시 시도해 주세요.</span>";
        console.error("Fetch Error:", error);
    } finally {
        document.getElementById('loading-msg').style.display = "none";
    }
}
