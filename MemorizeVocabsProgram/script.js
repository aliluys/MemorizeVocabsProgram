document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('fileInput');
    const numWordsInput = document.getElementById('numWords');
    const startButton = document.getElementById('startButton');
    const statusMessage = document.getElementById('statusMessage');
    const randomWordElement = document.getElementById('randomWord');
    const kanjiMeaningElement = document.getElementById('kanjiMeaning');
    const collectButton = document.getElementById('collectButton');
    const prevButton = document.getElementById('prevButton');
    const nextButton = document.getElementById('nextButton');
    const viewMeaningButton = document.getElementById('viewMeaningButton');
    const continueButton = document.getElementById('continueButton');
    const endButton = document.getElementById('endButton');
    const progressText = document.getElementById('progressText');
    const currentWordNumber = document.getElementById('currentWordNumber');

    let words = [];
    let collectedWords = [];
    let currentReviewWords = [];
    let currentIndex = -1;
    let totalWordsToReview = 0;
    let maxBrowsedCount = 0; // 记录最大浏览过的单词数量
    let originalTotalWords = 0; // 记录初始抽取的单词数量


    function showErrorMessage(message) {
        statusMessage.textContent = message;
    }

    function validatePositiveInteger(input) {
        const num = parseInt(input, 10);
        return !isNaN(num) && num > 0 && Number.isInteger(num);
    }

    fileInput.style.display = 'block';
    fileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    if (file.name.endsWith('.txt')) {
                        const text = e.target.result;
                        const lines = text.split('\n');
                        words = lines.map(line => {
                            const [kana, romaji, kanji, meaning] = line.split('-');
                            return { kana, kanji: kanji || '', meaning: meaning || '' };
                        });
                    } else if (file.name.endsWith('.xlsx')) {
                        const data = new Uint8Array(e.target.result);
                        const workbook = XLSX.read(data, { type: 'array' });
                        const sheetName = 'summary';
                        const worksheet = workbook.Sheets[sheetName];
                        if (!worksheet) {
                            throw new Error(`工作表 "${sheetName}" 不存在`);
                        }
                        const json = XLSX.utils.sheet_to_json(worksheet);

                        words = json.map(row => ({
                            kana: row.kana,
                            kanji: row.kanji || '',
                            meaning: row.meaning || ''
                        }));
                    } else {
                        throw new Error('不支持的文件类型');
                    }

                    console.log('解析后的单词数据:', words);
                    if (words.length === 0) {
                        console.log('警告：解析后的单词数据为空，请检查文件格式或内容。');
                        showErrorMessage('解析后的单词数据为空，请检查文件格式或内容。');
                    } else {
                        renderFileLoadedUI();
                    }
                } catch (error) {
                    console.log('文件读取或解析失败:', error);
                    showErrorMessage('文件读取或解析失败，请检查文件格式。');
                }
            };
            reader.readAsText(file); // 对于txt文件，读取为文本
        }
    });


    function renderFileLoadedUI() {
        fileInput.style.display = 'none';
        numWordsInput.style.display = 'block';
        numWordsInput.parentNode.querySelector('label').style.display = 'block';
        startButton.style.display = 'block';
        statusMessage.textContent = '';
        randomWordElement.textContent = '';
        kanjiMeaningElement.textContent = '';
        collectButton.style.display = 'none';
        prevButton.style.display = 'none';
        nextButton.style.display = 'none';
        viewMeaningButton.style.display = 'none';
        continueButton.style.display = 'none';
        endButton.style.display = 'none';
    }

    startButton.addEventListener('click', () => {
        console.log('开始学习按钮被点击');
        const numWordsStr = numWordsInput.value;
        if (validatePositiveInteger(numWordsStr)) {
            console.log('输入验证通过');
            console.log('输入的单词数量:', numWordsStr);
            let numWords = parseInt(numWordsStr, 10); // 将用户输入的数量转换为数字
            originalTotalWords = numWords; // 记录初始抽取的单词数量
            // 确保复习的单词数量不超过实际可用的单词数量
            totalWordsToReview = Math.min(numWords, words.length); // 使用较小值
            currentIndex = -1; // 重置当前索引
            maxBrowsedCount = 0; // 重置最大浏览过的单词数量
            console.log('开始显示单词');
            if (words.length > 0) {
                console.log('单词数据不为空');
                currentReviewWords = selectRandomWords(words, totalWordsToReview); // 修正抽取的单词数量
                console.log('抽取的单词列表:', currentReviewWords);
                if (currentReviewWords.length > 0) {
                    console.log('有可复习的单词');
                    currentIndex = 0;
                    showCurrentWord();
                    startButton.style.display = 'none';
                    numWordsInput.style.display = 'none';
                    numWordsInput.parentNode.querySelector('label').style.display = 'none';
                    prevButton.style.display = 'inline-block';
                    nextButton.style.display = 'inline-block';
                    viewMeaningButton.style.display = 'inline-block';
                    continueButton.style.display = 'inline-block';
                    endButton.style.display = 'inline-block';
                    updateProgressBar();
                } else {
                    console.log('没有剩余的单词可供复习');
                    showErrorMessage('没有剩余的单词可供复习。');
                }
            } else {
                console.log('单词数据为空');
                showErrorMessage('没有可供复习的单词，请先上传单词文件。');
            }
        } else {
            console.log('输入验证失败');
            showErrorMessage('请输入有效的正整数作为抽取单词数量。');
        }
    });



    function selectRandomWords(words, numWords) {
        const wordsCopy = [...words];
        const selectedWords = [];
        while (selectedWords.length < numWords && wordsCopy.length > 0) {
            const randomIndex = Math.floor(Math.random() * wordsCopy.length);
            selectedWords.push(wordsCopy.splice(randomIndex, 1)[0]);
        }
        console.log('选中的单词列表:', selectedWords);
        return selectedWords;
    }

    function showCurrentWord() {
        if (currentIndex >= 0 && currentIndex < currentReviewWords.length) {
            const currentWord = currentReviewWords[currentIndex];
            randomWordElement.innerHTML = `
                ${currentWord.kana}<br/>
            `;
            kanjiMeaningElement.textContent = '';
            collectButton.style.display = 'inline-block';
            prevButton.style.display = 'inline-block';
            nextButton.style.display = 'inline-block';
            viewMeaningButton.style.display = 'inline-block';
            updateProgressBar();
        } else {
            // 移除复习完成的逻辑
            currentIndex = -1;
            startButton.style.display = 'inline-block';
            numWordsInput.style.display = 'block';
            numWordsInput.parentNode.querySelector('label').style.display = 'block';
            collectButton.style.display = 'none';
            prevButton.style.display = 'none';
            nextButton.style.display = 'none';
            viewMeaningButton.style.display = 'none';
            updateProgressBar();
        }
    }

    collectButton.addEventListener('click', () => {
        const currentWord = currentReviewWords[currentIndex];
        if (!collectedWords.includes(currentWord.kana)) {
            collectedWords.push(currentWord.kana);
            console.log(`已收藏单词: ${currentWord.kana}`);
        }
        // 不要调用 moveNext();
        // 只更新进度条
        updateProgressBar();
    });


    viewMeaningButton.addEventListener('click', () => {
        const currentWord = currentReviewWords[currentIndex];
        kanjiMeaningElement.innerHTML = `
            漢字: ${currentWord.kanji}<br/>
            中文释义: ${currentWord.meaning}
        `;
    });

    endButton.addEventListener('click', () => {
        console.log('收藏的单词列表:', collectedWords);
        currentReviewWords = [];
        currentIndex = -1;
        maxBrowsedCount = 0; // 重置最大浏览过的单词数量
        totalWordsToReview = 0; // 重置总的复习单词数量
        renderFileLoadedUI();
    });


    continueButton.addEventListener('click', () => {
        const numWordsStr = numWordsInput.value;
        if (validatePositiveInteger(numWordsStr)) {
            const numWords = parseInt(numWordsStr, 10);
            const remainingWords = words.filter(word => !collectedWords.includes(word.kana));
            // 确保复习的单词数量不超过剩余单词数量
            const newReviewWords = selectRandomWords(remainingWords, Math.min(numWords, remainingWords.length));
            if (newReviewWords.length > 0) {
                const currentWord = currentReviewWords[currentIndex];
                currentReviewWords = currentReviewWords.concat(newReviewWords); // 将新抽取的单词加入到复习列表中
                totalWordsToReview += newReviewWords.length; // 更新总的复习单词数量
                currentReviewWords[currentIndex] = currentWord; // 确保当前单词保持不变
                maxBrowsedCount = Math.max(maxBrowsedCount, currentIndex + 1); // 更新最大浏览过的单词数量
                updateProgressBar();
            } else {
                showErrorMessage('没有剩余的单词可供复习。');
            }
        } else {
            showErrorMessage('请输入有效的正整数作为抽取单词数量。');
        }
    });


    prevButton.addEventListener('click', () => {
        if (currentIndex > 0) {
            currentIndex--;
            showCurrentWord();
            // 确保 maxBrowsedCount 不被减少
            maxBrowsedCount = Math.max(maxBrowsedCount, currentIndex + 1);
            updateProgressBar();
        }
    });


    nextButton.addEventListener('click', () => {
        if (currentIndex < currentReviewWords.length - 1) {
            currentIndex++;
            showCurrentWord();
            // 更新 maxBrowsedCount
            maxBrowsedCount = Math.max(maxBrowsedCount, currentIndex + 1);
            updateProgressBar();
        }
    });

    function moveNext() {
        if (currentIndex < currentReviewWords.length - 1) {
            currentIndex++;
            showCurrentWord();
        } else {
            // 移除复习完成的逻辑
            currentIndex = -1;
            startButton.style.display = 'inline-block';
            numWordsInput.style.display = 'block';
            numWordsInput.parentNode.querySelector('label').style.display = 'block';
            collectButton.style.display = 'none';
            prevButton.style.display = 'none';
            nextButton.style.display = 'none';
            viewMeaningButton.style.display = 'none';
            updateProgressBar();
        }
    }

    function updateProgressBar() {
        const browsedCount = maxBrowsedCount; // 使用 maxBrowsedCount 来显示浏览过的单词数量
        const progress = (browsedCount / totalWordsToReview) * 100;
        progressText.textContent = `已浏览 ${browsedCount} / ${totalWordsToReview} 个单词`;
        document.getElementById('progressBar').style.width = `${Math.min(progress, 100)}%`;
        currentWordNumber.textContent = `这是第 ${currentIndex + 1} 个单词`;
    }
    
});
