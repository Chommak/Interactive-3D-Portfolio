// เพลงประกอบ: ถ้ามีไฟล์ assets/music.mp3 จะใช้ไฟล์นั้น (ผู้วางไฟล์ต้องดูแลเรื่องลิขสิทธิ์เอง)
// ถ้าไม่มีจะสังเคราะห์เพลงเปียโนบอลาดที่แต่งทำนองขึ้นใหม่เองด้วย WebAudio (ไม่มีปัญหาลิขสิทธิ์)
const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);

// เดินคอร์ด 8 บาร์สไตล์บอลาดซึ้งๆ (แต่งใหม่)
const CHORDS = [
  [53, 57, 60, 64], // Fmaj7
  [55, 59, 62, 65], // G
  [52, 55, 59, 62], // Em7
  [57, 60, 64, 69], // Am
  [53, 57, 60, 64],
  [55, 59, 62, 65],
  [48, 55, 60, 64], // C
  [57, 60, 64, 69],
];

// เมโลดี้หลัก [beat, midi] แต่งใหม่เองไม่ให้ซ้ำเพลงใด
const MELODY = [
  [[0, 76], [1.5, 72], [3, 74]],
  [[0, 71], [2, 69]],
  [[0, 72], [1, 74], [2.5, 76], [3.5, 79]],
  [[0, 81], [2, 76]],
  [[0, 74], [1.5, 72], [3, 71]],
  [[0, 72], [2, 69]],
  [[0, 67], [1, 69], [2.5, 71], [3.5, 74]],
  [[0, 76], [2, 69]],
];

const BAR = 3.2;
const BEAT = BAR / 4;

// เพลงหลักที่เลือก: สตรีมผ่านตัวเล่น YouTube อย่างเป็นทางการ (ไม่คัดลอกไฟล์เพลง)
const YT_ID = '_BjRvvipER0';

export function createMusic() {
  let playing = false;
  let mode = null;
  let el = null;
  let ctx = null;
  let master = null;
  let delaySend = null;
  let timer = null;
  let nextBar = 0;
  let barIdx = 0;
  let yt = null;
  let ytHost = null;
  let ytReady = false;
  let ytFailed = false;

  function loadYTApi() {
    return new Promise((resolve) => {
      if (window.YT && window.YT.Player) return resolve();
      const prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        if (prev) prev();
        resolve();
      };
      const s = document.createElement('script');
      s.src = 'https://www.youtube.com/iframe_api';
      document.head.appendChild(s);
    });
  }

  async function startYT() {
    await loadYTApi();
    if (!ytHost) {
      ytHost = document.createElement('div');
      ytHost.style.cssText = 'position:fixed;left:-9999px;top:0;width:2px;height:2px;overflow:hidden';
      document.body.appendChild(ytHost);
    }
    if (!yt) {
      yt = new window.YT.Player(ytHost, {
        videoId: YT_ID,
        playerVars: { controls: 0, playsinline: 1, rel: 0 },
        events: {
          onReady: () => {
            ytReady = true;
          },
          onError: () => {
            ytFailed = true;
            ytReady = true;
          },
          onStateChange: (e) => {
            if (playing && e.data === window.YT.PlayerState.ENDED) yt.playVideo();
          },
        },
      });
    }
    await new Promise((resolve, reject) => {
      const t0 = Date.now();
      const iv = setInterval(() => {
        if (ytFailed) {
          clearInterval(iv);
          reject(new Error('yt blocked'));
        } else if (ytReady && yt.playVideo) {
          clearInterval(iv);
          resolve();
        } else if (Date.now() - t0 > 6000) {
          clearInterval(iv);
          reject(new Error('yt timeout'));
        }
      }, 100);
    });
    yt.setVolume(70);
    yt.playVideo();
    // บางเบราว์เซอร์ยังไม่ให้เล่นเสียงทันที รอเช็กสถานะแล้วกดซ้ำครั้งนึง
    await new Promise((r) => setTimeout(r, 1200));
    if (yt.getPlayerState && yt.getPlayerState() !== 1) yt.playVideo();
  }

  function initCtx() {
    if (ctx) return;
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);
    const delay = ctx.createDelay(1);
    delay.delayTime.value = 0.34;
    const fb = ctx.createGain();
    fb.gain.value = 0.3;
    const wet = ctx.createGain();
    wet.gain.value = 0.32;
    delay.connect(fb);
    fb.connect(delay);
    delay.connect(wet);
    wet.connect(master);
    delaySend = ctx.createGain();
    delaySend.connect(delay);
  }

  // เสียงเปียโนสังเคราะห์: พื้นฐาน + ฮาร์โมนิก 2/3 ลดหลั่นกัน ให้หางเสียงกังวาน
  function piano(t, midi, vel, dur) {
    const f = hz(midi);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vel, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    g.connect(master);
    g.connect(delaySend);
    [[1, 1], [2, 0.32], [3, 0.12]].forEach(([mult, amp]) => {
      const o = ctx.createOscillator();
      o.type = 'sine';
      o.frequency.value = f * mult;
      const og = ctx.createGain();
      og.gain.value = amp;
      o.connect(og);
      og.connect(g);
      o.start(t);
      o.stop(t + dur + 0.05);
    });
  }

  function schedule() {
    const ahead = ctx.currentTime + 0.7;
    while (nextBar < ahead) {
      const b = barIdx % 8;
      const ch = CHORDS[b];
      piano(nextBar, ch[0] - 12, 0.1, BAR * 0.9); // เบสนุ่มๆ ต้นบาร์
      for (let k = 0; k < 8; k++) {
        // อาร์เพจโจโรลขึ้นลงเบาๆ เป็นพื้นหลัง
        const m = ch[k % ch.length] + (k >= 4 ? 12 : 0);
        piano(nextBar + k * BEAT * 0.5, m, 0.045, 1.1);
      }
      for (const [bt, m] of MELODY[b]) piano(nextBar + bt * BEAT, m, 0.16, 1.7);
      nextBar += BAR;
      barIdx++;
    }
  }

  function startGen() {
    initCtx();
    ctx.resume();
    master.gain.setTargetAtTime(0.24, ctx.currentTime, 0.4);
    nextBar = ctx.currentTime + 0.1;
    barIdx = 0;
    timer = setInterval(schedule, 200);
  }

  function stopGen() {
    clearInterval(timer);
    timer = null;
    master.gain.setTargetAtTime(0, ctx.currentTime, 0.3);
  }

  async function start() {
    if (playing) return;
    if (!ytFailed) {
      try {
        await startYT();
        mode = 'yt';
        playing = true;
        return;
      } catch (e) {
        ytFailed = true;
        if (yt) {
          try {
            yt.destroy();
          } catch (err) {}
          yt = null;
          ytReady = false;
        }
      }
    }
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
    if (mode === 'yt' && yt) yt.pauseVideo();
    else if (mode === 'file') el.pause();
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
