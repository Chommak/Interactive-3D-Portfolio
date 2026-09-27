// เพลงประกอบ: ถ้ามีไฟล์ assets/music.mp3 จะใช้ไฟล์นั้น
// ถ้าไม่มีจะสังเคราะห์เพลง lo-fi เองด้วย WebAudio (ไม่มีปัญหาลิขสิทธิ์)
const CHORDS = [
  [220, 261.63, 329.63],
  [174.61, 220, 261.63],
  [196, 246.94, 293.66],
  [164.81, 196, 246.94],
];
const PENTA = [440, 523.25, 587.33, 659.25, 783.99];

export function createMusic() {
  let playing = false;
  let mode = null;
  let el = null;
  let ctx = null;
  let master = null;
  let delaySend = null;
  let timer = null;
  let nextChord = 0;
  let nextNote = 0;
  let chordIdx = 0;

  function initCtx() {
    if (ctx) return;
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);
    const delay = ctx.createDelay(1);
    delay.delayTime.value = 0.31;
    const fb = ctx.createGain();
    fb.gain.value = 0.34;
    const wet = ctx.createGain();
    wet.gain.value = 0.3;
    delay.connect(fb);
    fb.connect(delay);
    delay.connect(wet);
    wet.connect(master);
    delaySend = ctx.createGain();
    delaySend.connect(delay);
  }

  function pad(freq, t, dur) {
    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.value = freq;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.05, t + 1.2);
    g.gain.linearRampToValueAtTime(0.0001, t + dur);
    osc.connect(g);
    g.connect(master);
    osc.start(t);
    osc.stop(t + dur + 0.1);
  }

  function pluck(t) {
    const f = PENTA[(Math.random() * PENTA.length) | 0] * (Math.random() < 0.25 ? 2 : 1);
    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.value = f;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.16, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.7);
    osc.connect(g);
    g.connect(master);
    g.connect(delaySend);
    osc.start(t);
    osc.stop(t + 0.8);
  }

  function schedule() {
    const ahead = ctx.currentTime + 0.6;
    while (nextChord < ahead) {
      const ch = CHORDS[chordIdx % CHORDS.length];
      ch.forEach((f) => pad(f, nextChord, 4.2));
      pad(ch[0] / 2, nextChord, 4.2);
      nextChord += 4;
      chordIdx++;
    }
    while (nextNote < ahead) {
      if (Math.random() < 0.75) pluck(nextNote);
      nextNote += 0.45 + Math.random() * 0.5;
    }
  }

  function startGen() {
    initCtx();
    ctx.resume();
    master.gain.setTargetAtTime(0.22, ctx.currentTime, 0.4);
    nextChord = ctx.currentTime + 0.1;
    nextNote = ctx.currentTime + 0.6;
    timer = setInterval(schedule, 200);
  }

  function stopGen() {
    clearInterval(timer);
    timer = null;
    master.gain.setTargetAtTime(0, ctx.currentTime, 0.3);
  }

  async function start() {
    if (playing) return;
    if (mode !== 'gen') {
      if (!el) {
        el = new Audio('./assets/music.mp3');
        el.loop = true;
        el.volume = 0.5;
      }
      try {
        await el.play();
        mode = 'file';
        playing = true;
        return;
      } catch (e) {
        mode = 'gen';
      }
    }
    startGen();
    playing = true;
  }

  function stop() {
    if (!playing) return;
    playing = false;
    if (mode === 'file') el.pause();
    else stopGen();
  }

  return {
    async toggle() {
      if (playing) stop();
      else await start();
      return playing;
    },
  };
}
