async function generateExam() {
    const apiKey = localStorage.getItem('gemini_api_key'); // 기존 API 키 저장소 사용
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
            const prompt = `고등학교 영어 교사로서 다음 지문을 바탕으로 [${selectedType}] 문제 ${questionCount}문항을 출제해. 조건: 한국어 발문, 1~5번 객관식 선지, 정답 및 해설 하단 분리 표기. 지문: ${passage}`;

            // OpenRouter API 호출 방식 (OpenAI 호환)
            const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                method: 'POST', 
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`, // 새로 받은 sk-or-v1 키 입력
                    'HTTP-Referer': 'https://khh090630-lang.github.io/engquizapp/', // 본인 사이트 주소
                    'X-Title': 'English Quiz App'
                },
                body: JSON.stringify({ 
                    model: "google/gemini-flash-1.5-exp", // OpenRouter에서 지원하는 모델명
                    messages: [{ role: "user", content: prompt }] 
                })
            });
            
            const data = await res.json();
            
            if (data.choices && data.choices[0].message) {
                const generatedText = data.choices[0].message.content;
                finalExamText += `<h3>[Passage ${i + 1}]</h3>\n` + generatedText + `\n<hr>\n`;
            } else {
                console.error("OpenRouter Error:", data);
                finalExamText += `<p style='color:red;'><strong>오류:</strong> ${data.error ? data.error.message : '알 수 없는 오류'}</p>\n<hr>\n`;
            }
        }
        outputContent.innerHTML = finalExamText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>');
    } catch (error) {
        outputContent.innerHTML = "<span style='color:red;'>네트워크 연결 실패. 다시 시도해 주세요.</span>";
        console.error("Fetch Error:", error);
    } finally {
        document.getElementById('loading-msg').style.display = "none";
    }
}
