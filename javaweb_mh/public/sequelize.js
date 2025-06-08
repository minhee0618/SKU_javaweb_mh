let fileName = "";
let select = ""; 

let chart;
let chart_type = 'line';
let labels = [];
let minData = [];
let maxData = [];
let avgData = [];
let stdData = [];

// [1] 파일 리스트 클릭 → 데이터 로딩 + 산점도 표시
// -------------------------------------------
const profileList = document.querySelectorAll('#profile_list tr td:first-child');
profileList.forEach((el) => {
    el.addEventListener('click', function () {
        fileName = el.textContent;

        // 배경색 초기화 및 선택
        profileList.forEach(td => td.style.backgroundColor = "white");
        this.style.backgroundColor = "#888888";

        select = undefined;
        if (chart) chart.destroy();

        getdata();       // Core/Task 버튼 생성
        drawScatter();   // 산점도 그리기
    });
});

// [2] 프로파일 업로드 처리 
// -------------------------------------------
document.getElementById('profile_form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const files = document.querySelector('#input_profile').files;
    let profiles = [];
    let is_error = false;

    if (!files.length) return alert('파일을 등록하세요');

    const filePromises = Array.from(files).map(file => {
        if (file.name.split(".").pop().toLowerCase() === 'txt') {
            return new Promise(resolve => {
                readTextFile(file, (data) => {
                    profiles.push(data);
                    resolve();
                });
            });
        } else {
            alert(".txt파일만 입력해주세요");
            is_error = true;
        }
    });

    await Promise.all(filePromises);

    if (!is_error) {
        const response = await fetch('/profiles', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(profiles)
        });

        if (response.ok) {
            const data = await response.json();
            getList();
            alert(data.message);
        } else {
            console.error('파일 전송 중 오류 발생');
        }
    }
});

// [3] 전체 테이블 목록 불러오기
// -------------------------------------------
async function getList() {
    const res = await axios.get('profiles');
    const profiles = res.data;

    const tbody = document.querySelector('#profile_list tbody');
    tbody.innerHTML = '';

    profiles.forEach(profile => {
        const row = document.createElement('tr');

        const td = document.createElement('td');
        td.textContent = profile;
        td.className = 'text-center fw-semibold';

        td.addEventListener('click', function () {
            fileName = profile;

            document.querySelectorAll('#profile_list tr td:first-child').forEach(td =>
                td.style.backgroundColor = "white"
            );
            this.style.backgroundColor = "#888888";

            if (chart) chart.destroy();
            getdata();
            drawScatter();
        });

        if (profile === fileName) td.style.backgroundColor = "#888888";
        row.appendChild(td);

        // 삭제 버튼
        const td2 = document.createElement('td');
        const btndrop = document.createElement('button');
        btndrop.textContent = "delete";
        btndrop.className = "btn btn-danger btn-sm";
        btndrop.addEventListener('click', () => deleteTable(profile));
        td2.appendChild(btndrop);

        row.appendChild(td2);
        tbody.appendChild(row);
    });
}

// [4] 테이블 삭제
// -------------------------------------------
async function deleteTable(name) {
    await axios.delete(`profiles/drop/${name}`);
    if (fileName === name && chart) {
        chart.destroy();
        document.querySelector('#core').innerHTML = "";
        document.querySelector('#task').innerHTML = "";
        fileName = "";
    }
    setTimeout(getList, 50);
}

// [5] Core/Task 버튼 생성
// -------------------------------------------
async function getdata() {
    const res = await axios.get(`profiles/data/${fileName}`);
    const cores = res.data.cores;
    const tasks = res.data.tasks;

    const task_div = document.querySelector('#core');
    task_div.innerHTML = ' core : ';
    task_div.style.marginLeft = '40px';

    tasks.forEach(task => {
        const button = document.createElement('button');
        button.className = 'btn btn-info me-2';
        button.textContent = task.core;

        button.addEventListener('click', function () {
            updateChart('task', task.core);
            highlightButtons('core', this);
        });

        task_div.appendChild(button);
    });

    const core_div = document.querySelector('#task');
    core_div.innerHTML = ' task : ';
    core_div.style.marginLeft = '40px';

    cores.forEach(core => {
        const button = document.createElement('button');
        button.className = 'btn btn-info me-2';
        button.textContent = core.task;

        button.addEventListener('click', function () {
            updateChart('core', core.task);
            highlightButtons('task', this);
        });

        core_div.appendChild(button);
    });
}

// [6] 버튼 강조 상태 설정
// -------------------------------------------
function highlightButtons(type, activeBtn) {
    const targetDiv = document.getElementById(type === 'core' ? 'core' : 'task');
    const btns = targetDiv.getElementsByClassName('btn');
    for (let btn of btns) btn.className = "btn btn-info me-2";
    activeBtn.className = "btn btn-secondary me-2";
}

// [7] 파일 내용 파싱
// -------------------------------------------
function readTextFile(file, save) {
    const reader = new FileReader();
    reader.onload = function (event) {
        const lines = event.target.result.split("\n");
        const parsed = [[file.name]];
        lines.forEach(line => parsed.push(line.trim().split(/\t| |,|\//)));
        save(parsed);
    };
    reader.onerror = () => console.error("파일 읽기 오류 발생");
    reader.readAsText(file, 'UTF-8');
}

// [8] 차트 타입 버튼 클릭 처리
// -------------------------------------------
document.querySelectorAll("#chartType .btn").forEach(btn => {
    btn.addEventListener("click", function () {
        chart_type = this.id;
        setButtonClasses(this);
        if (fileName && select) updateChart(null, null);
    });
});

// 버튼 스타일 지정
function setButtonClasses(activeButton) {
    document.querySelectorAll("#chartType .btn").forEach(btn => btn.className = "btn btn-primary");
    activeButton.className = "btn btn-secondary";
}

// [9] 산점도
// -------------------------------------------
async function drawScatter() {
    const ctx = document.getElementById('profiler').getContext('2d');
    if (chart) chart.destroy();

    const res = await axios.get(`profiles/scatterdata/${fileName}`);
    const datas = res.data;

    const scatterData = datas.map((d, i) => ({
        x: i,
        y: Number(d.usaged),
        core: d.core,
        task: d.task
    })).filter(point => !isNaN(point.y));

    chart = new Chart(ctx, {
        type: 'scatter',
        data: {
            datasets: [{
                label: 'Usage Scatter',
                data: scatterData,
                backgroundColor: 'rgba(75, 192, 192, 0.8)',
                pointRadius: 5,
                pointHoverRadius: 10
            }]
        },
        options: {
            parsing: false,
            responsive: true,
            scales: {
                x: {
                    title: { display: true, text: 'Index' },
                    ticks: { display: false }
                },
                y: { title: { display: true, text: 'Usage' } }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: context => {
                            const raw = context.raw;
                            return `core: ${raw.core},  task: ${raw.task},  usage: ${raw.y}`;
                        }
                    }
                },
                title: {display: true,
                        text: `${fileName}`,
                        font: { size: 25 }
                }
            }
        }
    });
}

// [10] 차트 
// -------------------------------------------
async function updateChart(type, choose_name) {
    const ctx = document.getElementById('profiler').getContext('2d');
    if (chart) chart.destroy();

    if (type) {
        select = choose_name;
    }

    if (!fileName || !select) return;

    let res;
    if (type === 'core' || (!type && lastType === 'core')) {
        lastType = 'core';
        res = await axios.get(`profiles/taskdata/${fileName}/${select}`);
        labels = res.data.map(d => d.core);
    } else if (type === 'task' || (!type && lastType === 'task')) {
        lastType = 'task';
        res = await axios.get(`profiles/coredata/${fileName}/${select}`);
        labels = res.data.map(d => d.task);
    } else {
        return;
    }

    const data = res.data;
    minData = data.map(d => d.min_usaged);
    maxData = data.map(d => d.max_usaged);
    avgData = data.map(d => d.avg_usaged);
    stdData = data.map(d => d.std_usaged);

    // 폴라아리아, 도넛 차트
    if (['polarArea', 'doughnut'].includes(chart_type)) {
        chart = new Chart(ctx, {
            type: chart_type,
            data: {
                labels,
                datasets: [{
                    label: 'Avg',
                    data: avgData,
                    backgroundColor: [
                        'rgba(255, 0, 0, 0.5)',
                        'rgba(0, 0, 255, 0.5)',
                        'rgba(255, 206, 86, 0.5)',
                        'rgba(100, 255, 30, 0.5)',
                        'rgba(153, 102, 255, 0.5)',
                        'rgba(255, 159, 64, 0.5)',
                        'rgba(100, 255, 100, 0.5)',
                        'rgba(200, 100, 255, 0.5)',
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: `${fileName} 의 ${select}`,
                        font: { size: 25 }
                    }
                }
            }
        });
    } else {
        // 라인, 바, 레이더 차트
        chart = new Chart(ctx, {
            type: chart_type,
            data: {
                labels,
                datasets: [
                    { label: 'Min', data: minData, borderColor: 'rgba(0, 0, 255, 0.5)',backgroundColor: 'rgba(0, 0, 255, 0.5)'},
                    { label: 'Max', data: maxData, borderColor: 'rgba(255, 0, 0, 1)', backgroundColor: 'rgba(255, 0, 0, 0.5)'},
                    { label: 'Avg', data: avgData, borderColor: 'rgba(100, 255, 30, 1)', backgroundColor: 'rgba(100, 255, 30, 0.5)'},
                    { label: 'Std Dev', data: stdData, borderColor: 'rgb(243, 126, 0)', backgroundColor: 'rgba(243, 126, 0, 0.5)'}
                ]
            },
            options: {
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                },
                plugins: {
                    title: {
                        display: true,
                        text: `${fileName} 의 ${select}`,
                        font: { size: 25 }
                    }
                }
            }
        });
    }
}
