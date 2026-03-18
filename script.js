// --- NAVIGATION LOGIC ---
const navButtons = document.querySelectorAll('.nav-btn');
const sections = document.querySelectorAll('.app-section');

let currentMode = 'stopwatch'; // 'stopwatch' or 'timer'

navButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        navButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const targetId = btn.getAttribute('data-target');
        currentMode = targetId;
        
        sections.forEach(sec => {
            if(sec.id === targetId) {
                sec.style.display = targetId === 'stopwatch' ? 'block' : 'flex';
                void sec.offsetWidth; // Reflow for anim
                sec.classList.add('active-section');
            } else {
                sec.style.display = 'none';
                sec.classList.remove('active-section');
            }
        });
    });
});


// --- STOP WATCH LOGIC ---
const minutesDisplay = document.getElementById('minutes');
const secondsDisplay = document.getElementById('seconds');
const millisecondsDisplay = document.getElementById('milliseconds');
const startStopBtn = document.getElementById('startStopBtn');
const lapBtn = document.getElementById('lapBtn');
const resetBtn = document.getElementById('resetBtn');
const lapsList = document.getElementById('lapsList');
const timeRing = document.querySelector('.time-ring');
const startIcon = document.getElementById('startIcon');
const pauseIcon = document.getElementById('pauseIcon');
const exportBtn = document.getElementById('exportBtn');

let swStartTime, swUpdatedTime, swDifference = 0, swInterval;
let swRunning = false;
let lapCounter = 1;
let laps = [];

function formatTime(timeVal) {
    let date = new Date(timeVal);
    let m = date.getUTCMinutes();
    let s = date.getUTCSeconds();
    let ms = Math.floor(date.getUTCMilliseconds() / 10);
    return {
        m: m < 10 ? "0" + m : m,
        s: s < 10 ? "0" + s : s,
        ms: ms < 10 ? "0" + ms : ms
    };
}

function getShowTime() {
    swUpdatedTime = new Date().getTime();
    swDifference = swUpdatedTime - swStartTime;
    let t = formatTime(swDifference);
    minutesDisplay.textContent = t.m;
    secondsDisplay.textContent = t.s;
    millisecondsDisplay.textContent = "." + t.ms;
}

function triggerSwStartStop() {
    if (!swRunning) {
        swStartTime = new Date().getTime() - swDifference;
        swInterval = setInterval(getShowTime, 10);
        swRunning = true;
        startStopBtn.classList.remove('btn-start');
        startStopBtn.classList.add('btn-pause');
        startIcon.style.display = 'none';
        pauseIcon.style.display = 'block';
        lapBtn.disabled = false;
        timeRing.classList.add('running');
    } else {
        clearInterval(swInterval);
        swRunning = false;
        startStopBtn.classList.remove('btn-pause');
        startStopBtn.classList.add('btn-start');
        startIcon.style.display = 'block';
        pauseIcon.style.display = 'none';
        timeRing.classList.remove('running');
    }
}

function resetSwTimer() {
    clearInterval(swInterval);
    swRunning = false;
    swDifference = 0;
    minutesDisplay.textContent = "00";
    secondsDisplay.textContent = "00";
    millisecondsDisplay.textContent = ".00";
    startStopBtn.classList.remove('btn-pause');
    startStopBtn.classList.add('btn-start');
    startIcon.style.display = 'block';
    pauseIcon.style.display = 'none';
    timeRing.classList.remove('running');
    lapBtn.disabled = true;
    exportBtn.disabled = true;
    
    // Clear laps UI except empty state
    lapsList.innerHTML = '<div class="empty-state">No laps recorded yet</div>';
    lapCounter = 1;
    laps = [];
}

function updateLapStyling() {
    const lapItems = document.querySelectorAll('.lap-item');
    if (lapItems.length < 2 || laps.length < 2) return;
    lapItems.forEach(item => item.classList.remove('best-lap', 'worst-lap'));
    const durations = laps.map(lap => lap.duration);
    const min = Math.min(...durations);
    const max = Math.max(...durations);
    laps.forEach((lap, index) => {
        if(lap.duration === min) lapItems[laps.length - 1 - index].classList.add('best-lap');
        else if(lap.duration === max) lapItems[laps.length - 1 - index].classList.add('worst-lap');
    });
}

function addLap() {
    if (!swRunning) return;
    
    // Remove empty state if present
    const emptyState = document.querySelector('.empty-state');
    if(emptyState) emptyState.remove();

    const prevLapTime = laps.length > 0 ? laps[laps.length - 1].totalTime : 0;
    const currentLapDuration = swDifference - prevLapTime;
    laps.push({ index: lapCounter, totalTime: swDifference, duration: currentLapDuration });
    
    const fTime = formatTime(swDifference);
    const fDuration = formatTime(currentLapDuration);
    
    const li = document.createElement('li');
    li.className = 'lap-item';
    li.innerHTML = `<span class="lap-index">Lap ${lapCounter < 10 ? '0'+lapCounter : lapCounter}</span>
        <div><span class="lap-diff">+${fDuration.m}:${fDuration.s}.${fDuration.ms}</span>
        <span class="lap-time">${fTime.m}:${fTime.s}.${fTime.ms}</span></div>`;
    
    lapsList.prepend(li);
    const scrollArea = document.querySelector('.laps-scroll-area');
    if(scrollArea) scrollArea.scrollTop = 0;
    lapCounter++;
    updateLapStyling();
    exportBtn.disabled = false;
}

function exportLaps() {
    if (laps.length === 0) return;
    let csvContent = "data:text/csv;charset=utf-8,Lap Number,Lap Time,Split Time\n";
    [...laps].reverse().forEach(lap => {
        let fTime = formatTime(lap.totalTime);
        let fDuration = formatTime(lap.duration);
        csvContent += `Lap ${lap.index},${fDuration.m}:${fDuration.s}.${fDuration.ms},${fTime.m}:${fTime.s}.${fTime.ms}\n`;
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    const d = new Date();
    const ts = `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}_${String(d.getHours()).padStart(2,'0')}${String(d.getMinutes()).padStart(2,'0')}`;
    link.setAttribute("download", `stopwatch_laps_${ts}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

startStopBtn.addEventListener('click', triggerSwStartStop);
resetBtn.addEventListener('click', resetSwTimer);
lapBtn.addEventListener('click', addLap);
exportBtn.addEventListener('click', exportLaps);


// --- TIMER LOGIC ---
const tStartStopBtn = document.getElementById('timerStartStopBtn');
const tResetBtn = document.getElementById('timerResetBtn');
const inHours = document.getElementById('inputHours');
const inMinutes = document.getElementById('inputMinutes');
const inSeconds = document.getElementById('inputSeconds');
const timerInputGroup = document.getElementById('timerInputGroup');
const timerCountdown = document.getElementById('timerCountdown');
const tHoursDisplay = document.getElementById('tHours');
const tMinutesDisplay = document.getElementById('tMinutes');
const tSecondsDisplay = document.getElementById('tSeconds');
const timerProgress = document.getElementById('timerProgress');

const tStartIcon = document.getElementById('t-startIcon');
const tPauseIcon = document.getElementById('t-pauseIcon');
const alarmSound = document.getElementById('alarmSound');
const presetBtns = document.querySelectorAll('.timer-preset-btn');

// Modal Elements
const alarmModal = document.getElementById('alarmModal');
const closeModalBtn = document.getElementById('closeModalBtn');

let tmrInterval;
let tmrTotalSeconds = 0;
let tmrRemainingSeconds = 0;
let tmrRunning = false;

// Presets
presetBtns.forEach(pbtn => {
    pbtn.addEventListener('click', () => {
        if(tmrRunning) return; // Don't interrupt running timer blindly
        const totalSec = parseInt(pbtn.getAttribute('data-sec'));
        let h = Math.floor(totalSec / 3600);
        let m = Math.floor((totalSec % 3600) / 60);
        let s = totalSec % 60;
        
        inHours.value = h < 10 ? '0'+h : h;
        inMinutes.value = m < 10 ? '0'+m : m;
        inSeconds.value = s < 10 ? '0'+s : s;
    });
});

[inHours, inMinutes, inSeconds].forEach(input => {
    input.addEventListener('change', () => {
        let val = parseInt(input.value) || 0;
        if(input.id !== 'inputHours' && val > 59) val = 59;
        if(val < 0) val = 0;
        input.value = val < 10 ? '0'+val : val;
    });
});

function updateTimerDisplay() {
    let h = Math.floor(tmrRemainingSeconds / 3600);
    let m = Math.floor((tmrRemainingSeconds % 3600) / 60);
    let s = tmrRemainingSeconds % 60;
    tHoursDisplay.textContent = h < 10 ? '0'+h : h;
    tMinutesDisplay.textContent = m < 10 ? '0'+m : m;
    tSecondsDisplay.textContent = s < 10 ? '0'+s : s;

    // Fast-CSS Circle SVG transitions based on ratio
    if(tmrTotalSeconds > 0) {
        // dashoffset transitions linearly over 1 second due to CSS
        const dashoffset = 301.59 * (1 - (tmrRemainingSeconds / tmrTotalSeconds));
        timerProgress.style.strokeDashoffset = dashoffset;
        
        if (tmrRemainingSeconds <= 10 && tmrRemainingSeconds > 0) {
            timerProgress.classList.add('warning');
        } else {
            timerProgress.classList.remove('warning');
        }
    }
}

function triggerTimerStartStop() {
    if (!tmrRunning) {
        if(tmrRemainingSeconds === 0) {
            let h = parseInt(inHours.value) || 0;
            let m = parseInt(inMinutes.value) || 0;
            let s = parseInt(inSeconds.value) || 0;
            tmrTotalSeconds = (h * 3600) + (m * 60) + s;
            tmrRemainingSeconds = tmrTotalSeconds;
            
            if(tmrTotalSeconds === 0) return; 
        }

        timerInputGroup.classList.add('timer-countdown-hidden');
        timerCountdown.classList.remove('timer-countdown-hidden');
        
        timerProgress.style.transition = 'none'; // reset transition temporary
        updateTimerDisplay();
        setTimeout(() => { timerProgress.style.transition = 'stroke-dashoffset 1s linear, stroke 0.3s ease'; }, 50);

        tmrInterval = setInterval(() => {
            tmrRemainingSeconds--;
            updateTimerDisplay();
            
            if (tmrRemainingSeconds <= 0) {
                clearInterval(tmrInterval);
                tmrRunning = false;
                timerEnd();
            }
        }, 1000);

        tmrRunning = true;
        tStartIcon.style.display = 'none';
        tPauseIcon.style.display = 'block';
        document.querySelector('.timer-svg').classList.add('timer-running');
        
        // Disable presets while running
        presetBtns.forEach(btn => btn.style.opacity = '0.5');
    } else {
        clearInterval(tmrInterval);
        tmrRunning = false;
        tStartIcon.style.display = 'block';
        tPauseIcon.style.display = 'none';
        document.querySelector('.timer-svg').classList.remove('timer-running');
    }
}

function timerEnd() {
    tStartIcon.style.display = 'block';
    tPauseIcon.style.display = 'none';
    document.querySelector('.timer-svg').classList.remove('timer-running');
    
    // Play sound and show modal
    if(alarmSound) {
        alarmSound.currentTime = 0;
        alarmSound.play().catch(e => console.log('Audio play blocked'));
    }
    
    alarmModal.classList.add('active');
}

function resetTimerFeature() {
    clearInterval(tmrInterval);
    tmrRunning = false;
    tmrRemainingSeconds = 0;
    tmrTotalSeconds = 0;
    
    timerInputGroup.classList.remove('timer-countdown-hidden');
    timerCountdown.classList.add('timer-countdown-hidden');
    timerProgress.style.transition = 'none';
    timerProgress.style.strokeDashoffset = 0;
    timerProgress.classList.remove('warning');

    tStartIcon.style.display = 'block';
    tPauseIcon.style.display = 'none';
    document.querySelector('.timer-svg').classList.remove('timer-running');
    presetBtns.forEach(btn => btn.style.opacity = '1');
    
    if(alarmSound) {
        alarmSound.pause();
        alarmSound.currentTime = 0;
    }
}

// Modal handling
closeModalBtn.addEventListener('click', () => {
    alarmModal.classList.remove('active');
    resetTimerFeature();
});

tStartStopBtn.addEventListener('click', triggerTimerStartStop);
tResetBtn.addEventListener('click', resetTimerFeature);


// --- GLOBAL KEYBOARD LOGIC ---
document.addEventListener('keydown', function(e) {
    const activeEl = document.activeElement;
    if (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA') return;

    if (e.code === 'Space') {
        // Prevent if modal is active, let space click the OK button instead
        if(alarmModal.classList.contains('active')) {
             e.preventDefault();
             closeModalBtn.click();
             return;
        }
        e.preventDefault();
        if (currentMode === 'stopwatch') triggerSwStartStop();
        else triggerTimerStartStop();
    } else if (e.code === 'KeyL' || e.key === 'l' || e.key === 'L') {
        if (currentMode === 'stopwatch' && swRunning) addLap();
    } else if (e.code === 'KeyR' || e.key === 'r' || e.key === 'R') {
        if (currentMode === 'stopwatch') resetSwTimer();
        else resetTimerFeature();
    }
});
