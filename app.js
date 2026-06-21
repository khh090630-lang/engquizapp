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
            1. 출제할 유형: ${selectedType}
            2. 문제 형식: 반드시 아래 제공된 예시 중 '${selectedType}'에 해당하는 형식을 완벽하게 모방하여 1문제를 출력할 것.

            [예시 형식]: 빈칸 추론일 경우
            [지문]
            Humans excel at visual imagery. Our brains evolved this ability to create an internal mental picture of the world in which we can rehearse forthcoming actions. However, evolution has seen to it that such internally generated representations are never as authentic as the real thing. If your internal model of the world were a perfect substitute, then anytime you felt hungry you could simply imagine yourself at ____. You would have no incentive to find real food and would soon starve to death.

            [문제]
            위 글의 빈칸에 들어갈 말로 가장 적절한 것은?
            ① a restaurant enjoying a meal
            ② a banquet, consuming a feast
            ③ home cooking a delicious dinner
            ④ a picnic with friends
            ⑤ a farm harvesting fresh crops

            [정답 및 해설]
            정답: ②
            해설: 상상만으로 배고픔을 달랠 수 없다는 예시가 와야 하므로 '연회에서 만찬을 즐기는 상황'이 적절함.

            [예시 형식]: 순서 배열일 경우
            [지문]
            (A) But evolution has seen to it that such internally generated representations are never as authentic as the real thing. This is a wise bit of self restraint on your genes’ part.

            (B) Humans excel at visual imagery. Our brains evolved this ability to create an internal mental picture or model of the world in which we can rehearse forthcoming actions, without the risks of the real world.

            (C) If your internal model were a perfect substitute, you would starve to death because you would have no incentive to find real food.

            [문제]
            주어진 글 다음에 이어질 글의 순서로 가장 적절한 것은?
            ① (A)-(C)-(B) ② (B)-(A)-(C) ③ (B)-(C)-(A) ④ (C)-(A)-(B) ⑤ (C)-(B)-(A)

            [정답 및 해설]
            정답: ②
            해설: 인간의 능력(B) -> 하지만 한계가 있음(A) -> 구체적 예시(C) 순서가 자연스러움.

            [예시 형식]: 주제/제목 찾기일 경우
            [지문]
            Humans excel at visual imagery. Our brains evolved this ability to create an internal mental picture or model of the world in which we can rehearse forthcoming actions, without the risks or the penalties of doing them in the real world. [...] As the Bard said, “You cannot cloy the hungry edge of appetite by bare imagination of a feast.”

            [문제]
            다음 글의 제목으로 가장 적절한 것은?
            ① The Evolution of Human Imagination and Its Limit
            ② Visual Imagery: The Ultimate Substitute for Reality
            ③ Why Brain Imaging is Essential for Psychology
            ④ How to Satisfy Hunger Through Mental Simulation
            ⑤ The Differences Between Real Food and Imagined Feasts

            [정답 및 해설]
            정답: ①
            해설: 인간의 시각적 이미지 능력의 진화적 이점과 동시에, 현실을 완전히 대체할 수는 없다는 한계를 종합적으로 다루고 있음. ②번은 '완벽한 대체재'라고 하여 지문의 내용과 반대되므로 오답.

            [예시 형식]: 문장 삽입일 경우
            [지문]
            Humans excel at visual imagery. Our brains evolved this ability to create an internal mental picture or model of the world in which we can rehearse forthcoming actions, without the risks or the penalties of doing them in the real world. [1] There are even hints from brain imaging studies by Harvard University psychologist Steve Kosslyn showing that your brain uses the same regions to imagine a scene as when you actually view one. [2] But evolution has seen to it that such internally generated representations are never as authentic as the real thing. [3] If your internal model of the world were a perfect substitute, then anytime you felt hungry you could simply imagine yourself at a banquet, consuming a feast. [4] You would have no incentive to find real food and would soon starve to death.

            [삽입할 문장]
            This is a wise bit of self restraint on your genes’ part.

            [문제]
            글의 흐름으로 보아, 주어진 문장이 들어가기에 가장 적절한 곳은?
            ① [1]  ② [2]  ③ [3]  ④ [4]  ⑤ [5]

            [정답 및 해설]
            정답: ③
            해설: 내부 모델이 현실만큼 진실하지 않다는 진술 뒤에, 왜 그런 제한이 유전적 차원에서 현명한 일인지 설명하는 문장이 와야 함.

            [예시 형식]: 요약문 완성일 경우
            [지문]
            Humans excel at visual imagery. Our brains evolved this ability to create an internal mental picture or model of the world in which we can rehearse forthcoming actions, without the risks or the penalties of doing them in the real world. There are even hints from brain imaging studies by Harvard University psychologist Steve Kosslyn showing that your brain uses the same regions to imagine a scene as when you actually view one. But evolution has seen to it that such internally generated representations are never as authentic as the real thing. This is a wise bit of self-restraint on your genes’ part. If your internal model of the world were a perfect substitute, then anytime you felt hungry you could simply imagine yourself at a banquet, consuming a feast. You would have no incentive to find real food and would soon starve to death.  
            
            [문제]
            다음 글의 내용을 한 문장으로 요약하고자 한다. 빈칸 (A), (B)에 들어갈 말로 가장 적절한 것은? 
            Although humans have evolved the ability to (A)______ their future actions through internal mental simulations, such models cannot (B)______ the necessity of actual physical experiences for survival. 
            
            ① (A) rehearse - (B) substitute
            ② (A) interpret - (B) reinforce
            ③ (A) neglect - (B) distinguish
            ④ (A) evaluate - (B) improve
            ⑤ (A) observe - (B) complicate

            [정답 및 해설]
            정답: ①
            해설: (A): 지문에서 "rehearse forthcoming actions"라고 언급했으므로 'rehearse'가 적절함. (B): 내부 모델이 실제 현실을 완벽하게 대체할 수 없다고 했으므로 'substitute'가 적절함.

            ---
            
            주의: 잡담, 인사, "문제입니다"와 같은 문구 절대 금지. 
            만약 '순서 배열' 유형이라면 지문을 (A), (B), (C)로 나누어 제시하고 선지는 (A)-(C)-(B) 이런식으로 순서를 맞추도록 내줄 것. 
            만약 '빈칸 추론' 유형이라면 전체지문에 빈칸(____)을 뚫고 그 빈칸에 들어갈 내용을 정답으로 선지에서 제시하고 나머지 네 개의 선지는 헷갈릴만한 빈칸에 들어가기에 문맥상 어색한 문장을 제시할 것.
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
