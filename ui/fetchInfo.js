document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const subject = params.get('subject');
    const teacher = params.get('teacher');

    const buildApiUrl = () => {
        const url = new URL('/api/homework', window.location.origin);
        if(subject) url.searchParams.set('subject', subject);
        if(teacher) url.searchParams.set('teacher', teacher);
        return url.toString();
    };

    function loadList(){
        fetch(buildApiUrl())
        .then(response => {
            if (!response.ok) throw new Error('ネットワークの接続を確認してください。');
            return response.json();
        })
        .then(data => {
            const tableBody = document.getElementById('homework-list');
            const countBadge = document.getElementById('task-count');

            countBadge.textContent = `${data.length} 件のタスク`;

            if (data.length === 0) {
                tableBody.innerHTML = `<tr><td colspan="2" class="text-center py-4 text-muted">宿題はありません。</td></tr>`;
                countBadge.textContent = `0 件のタスク`;
                return;
            }

            let rows = '';
            data.forEach(item => {
                rows += `
                    <tr>
                        <td style="width:75%;"><span class="fw-semibold text-dark">${item.HomeWorkName}</span></td>
                        <td style="width:25%; white-space:nowrap;"><span class="text-danger fw-medium">${item.deadline}</span></td>
                    </tr>
                `;
            });

            tableBody.innerHTML = rows;
        })
        .catch(error => {
            console.error('Error:', error);
            document.getElementById('homework-list').innerHTML = `
                <tr>
                    <td colspan="2" class="text-center py-4 text-danger">
                        データの取得に失敗しました。
                    </td>
                </tr>
            `;
        });
    }

    loadList();

    // Attach form handler if add form exists
    const form = document.getElementById('add-homework-form');
    if(form){
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const nameInput = document.getElementById('homeWorkName');
            const deadlineInput = document.getElementById('deadline');
            const errorEl = document.getElementById('form-error');
            errorEl.style.display = 'none';

            const homeWorkName = nameInput.value.trim();
            const deadline = deadlineInput.value;
            if(!homeWorkName){
                errorEl.textContent = '課題名を入力してください。';
                errorEl.style.display = 'block';
                return;
            }
            const dl = new Date(deadline);
            if(isNaN(dl.getTime()) || dl.getTime() <= Date.now()){
                errorEl.textContent = '提出期限は現在より未来の日時を指定してください。';
                errorEl.style.display = 'block';
                return;
            }

            // send POST
            fetch('/api/homework', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ homeWorkName, deadline: dl.toISOString(), subject: subject || '', teacher: teacher || '' })
            })
            .then(r => r.json().then(body => ({ ok: r.ok, body })))
            .then(({ ok, body }) => {
                if(!ok){
                    errorEl.textContent = body.error || '保存に失敗しました';
                    errorEl.style.display = 'block';
                    return;
                }
                // clear form and reload list
                nameInput.value = '';
                // reload
                loadList();
            })
            .catch(err => {
                console.error(err);
                errorEl.textContent = '通信エラーが発生しました';
                errorEl.style.display = 'block';
            });
        });
    }
});