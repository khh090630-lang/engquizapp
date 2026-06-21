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
            
            // 여기서 AI에게 엄격한 형식을 요구합니다.
            const prompt = `
            [지시사항]
            1. 아래 주어진 지문을 읽고 수능형(CSAT) 문제 ${questionCount}문항을 출제해.
            2. 출력 형식:
            [지문]
            (지문 내용을 그대로 보여줄 것)

            [문제]
            (문제 문항)
            ① ...
            ② ...
            ③ ...
            ④ ...
            ⑤ ...

            [정답 및 해설]
            (정답과 간단한 해설)

            3. 절대 "여기 문제가 있습니다" 같은 군더더기 말을 하지 마. 오직 위 형식으로만 답변해.

            [지문 내용]
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
                    model: "openai/gpt-4o-mini", // 혹은 google/gemini-1.5-flash
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
