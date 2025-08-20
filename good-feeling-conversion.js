// シンプルなCtrl+S体験デモ
const textareas = document.querySelectorAll('.demo-textarea');

// ページ全体でCtrl+Sをキャッチ
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 's') {
        e.preventDefault(); // ブラウザの保存ダイアログを防ぐ
        e.stopPropagation();
        
        // フォーカスされているテキストエリアがある場合
        const activeElement = document.activeElement;
        if (activeElement && activeElement.classList.contains('demo-textarea')) {
            const selectedText = activeElement.value.substring(activeElement.selectionStart, activeElement.selectionEnd);
            if (selectedText) {
                // テキストエリアの境界線を一時的に緑色にしてフィードバック
                activeElement.style.borderColor = '#4caf50';
                activeElement.style.boxShadow = '0 0 10px rgba(76, 175, 80, 0.5)';
                
                // 2秒後に元に戻す
                setTimeout(() => {
                    activeElement.style.borderColor = '';
                    activeElement.style.boxShadow = '';
                }, 2000);
            }
        }
    }
});

// 各テキストエリアにCtrl+Sイベントリスナーを追加（重複だが確実性のため）
textareas.forEach(textarea => {
    textarea.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === 's') {
            e.preventDefault();
            e.stopPropagation();
            
            const selectedText = textarea.value.substring(textarea.selectionStart, textarea.selectionEnd);
            if (selectedText) {
                // テキストエリアの境界線を一時的に緑色にしてフィードバック
                textarea.style.borderColor = '#4caf50';
                textarea.style.boxShadow = '0 0 10px rgba(76, 175, 80, 0.5)';
                
                // 2秒後に元に戻す
                setTimeout(() => {
                    textarea.style.borderColor = '';
                    textarea.style.boxShadow = '';
                }, 2000);
            }
        }
    });
});