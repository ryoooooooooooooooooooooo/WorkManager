document.addEventListener('DOMContentLoaded', () => {
    const API_URL = ''; 

    fetch(API_URL)
        .then(response => {
            if (!response.ok) throw new Error('ネットワークの接続を確認してください。');
            return response.json();
        })
        .then(data => {
            const tableBody = document.getElementById('homework-list');
            const countBadge = document.getElementById('task-count');
            
            countBadge.textContent = `${data.length} 件のタスク`;

            if (data.length === 0) {
                tableBody.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-muted">宿題はありません。</td></tr>`;
                return;
            }

            let rows = '';
            data.forEach(item => {
                rows += `
                    <tr>
                        <td><span class="text-muted fw-bold">#${item.HomeWorkId}</span></td>
                        <td><span class="fw-semibold text-dark">${item.HomeWorkName}</span></td>
                        <td>
                            <span class="badge bg-secondary-subtle text-secondary-emphasis">${item.subjectName}</span>
                            <small class="text-muted d-block d-md-inline ms-md-1">(${item.teacherName})</small>
                        </td>
                        <td>${item.studentName}</td>
                        <td><span class="text-danger fw-medium">${item.deadline}</span></td>
                    </tr>
                `;
            });

            tableBody.innerHTML = rows;
        })
        .catch(error => {
            console.error('Error:', error);
            document.getElementById('homework-list').innerHTML = `
                <tr>
                    <td colspan="5" class="text-center py-4 text-danger">
                        データの取得に失敗しました。
                    </td>
                </tr>
            `;
        });
});