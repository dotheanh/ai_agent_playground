        (() => {
                // --- SFX (procedural WebAudio) ---
                let audioCtx = null;

                function getCtx() {
                    if (!audioCtx) {
                        audioCtx = new(window.AudioContext || window.webkitAudioContext)();
                    }
                    if (audioCtx.state === "suspended") audioCtx.resume();
                    return audioCtx;
                }

                function beep(freq = 440, dur = 0.08, type = "sine", gain = 0.12) {
                    const ctx = getCtx();
                    const o = ctx.createOscillator();
                    const g = ctx.createGain();
                    o.type = type;
                    o.frequency.value = freq;
                    g.gain.value = 0;
                    o.connect(g);
                    g.connect(ctx.destination);
                    const t = ctx.currentTime;
                    g.gain.setValueAtTime(0, t);
                    g.gain.linearRampToValueAtTime(gain, t + 0.005);
                    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
                    o.start(t);
                    o.stop(t + dur);
                }

                function noiseBurst(dur = 0.18, gain = 0.18) {
                    const ctx = getCtx();
                    const bufferSize = Math.floor(ctx.sampleRate * dur);
                    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
                    const data = buffer.getChannelData(0);
                    for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 2);
                    const src = ctx.createBufferSource();
                    src.buffer = buffer;
                    const filter = ctx.createBiquadFilter();
                    filter.type = "lowpass";
                    filter.frequency.value = 900;
                    const g = ctx.createGain();
                    g.gain.value = gain;
                    src.connect(filter);
                    filter.connect(g);
                    g.connect(ctx.destination);
                    src.start();
                }

                function sfxShoot() { beep(820, 0.06, "square", 0.08);
                    beep(320, 0.08, "sawtooth", 0.04); }

                function sfxFly() { beep(520, 0.05, "triangle", 0.03); }

                function sfxBoom(dmg = 0) {
                    if (dmg > 90) {
                        // MEGA Explosion - x3 volume, longer decay
                        const ctx = getCtx();
                        const bufferSize = ctx.sampleRate * 1.2;
                        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
                        const data = buffer.getChannelData(0);
                        let lastOut = 0;
                        for (let i = 0; i < bufferSize; i++) {
                            const white = Math.random() * 2 - 1;
                            data[i] = (lastOut = (0.02 * white) + (0.98 * lastOut)) * 6;
                        }
                        const src = ctx.createBufferSource();
                        src.buffer = buffer;
                        const filter = ctx.createBiquadFilter();
                        filter.type = 'lowpass';
                        filter.frequency.value = 250;
                        const g = ctx.createGain();
                        g.gain.setValueAtTime(1.8, ctx.currentTime);
                        g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.2);
                        src.connect(filter);
                        filter.connect(g);
                        g.connect(ctx.destination);
                        src.start();
                    } else if (dmg >= 70) {
                        // Swoosh lao nhanh
                        const ctx = getCtx();
                        const bufferSize = ctx.sampleRate * 0.4;
                        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
                        const data = buffer.getChannelData(0);
                        for (let i = 0; i < bufferSize; i++) {
                            data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 3);
                        }
                        const src = ctx.createBufferSource();
                        src.buffer = buffer;
                        const filter = ctx.createBiquadFilter();
                        filter.type = 'lowpass';
                        filter.frequency.value = 1500;
                        const g = ctx.createGain();
                        g.gain.value = 0.4;
                        src.connect(filter);
                        filter.connect(g);
                        g.connect(ctx.destination);
                        src.start();
                    } else if (dmg >= 50) {
                        // Shotgun blast
                        const ctx = getCtx();
                        const bufferSize = ctx.sampleRate * 0.1;
                        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
                        const data = buffer.getChannelData(0);
                        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
                        const src = ctx.createBufferSource();
                        src.buffer = buffer;
                        const filter = ctx.createBiquadFilter();
                        filter.type = 'bandpass';
                        filter.frequency.value = 800;
                        filter.Q.value = 0.5;
                        const g = ctx.createGain();
                        g.gain.setValueAtTime(0.5, ctx.currentTime);
                        g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
                        src.connect(filter);
                        filter.connect(g);
                        g.connect(ctx.destination);
                        src.start();
                    } else {
                        // Silenced shot for low damage
                        const ctx = getCtx();
                        const bufferSize = ctx.sampleRate * 0.08;
                        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
                        const data = buffer.getChannelData(0);
                        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
                        const src = ctx.createBufferSource();
                        src.buffer = buffer;
                        const filter = ctx.createBiquadFilter();
                        filter.type = 'lowpass';
                        filter.frequency.value = 300;
                        const g = ctx.createGain();
                        g.gain.setValueAtTime(0.25, ctx.currentTime);
                        g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
                        src.connect(filter);
                        filter.connect(g);
                        g.connect(ctx.destination);
                        src.start();
                    }
                }

                // Coin ding for footsteps
                function sfxStep() {
                    const ctx = getCtx();
                    const o = ctx.createOscillator();
                    const g = ctx.createGain();
                    o.type = 'sine';
                    o.frequency.setValueAtTime(1318.5, ctx.currentTime); // E6
                    o.frequency.setValueAtTime(1975.5, ctx.currentTime + 0.03); // B6
                    g.gain.setValueAtTime(0.15, ctx.currentTime);
                    g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
                    o.connect(g);
                    g.connect(ctx.destination);
                    o.start();
                    o.stop(ctx.currentTime + 0.1);
                }

                // Heartbeat for low HP
                let heartbeatInterval = null;

                function startHeartbeat() {
                    if (heartbeatInterval) return;
                    const beat = () => {
                        const ctx = getCtx();
                        if (!ctx) return;
                        // Main beat
                        const o = ctx.createOscillator();
                        const g = ctx.createGain();
                        o.type = 'sine';
                        o.frequency.value = 60;
                        g.gain.setValueAtTime(0.2, ctx.currentTime);
                        g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
                        o.connect(g);
                        g.connect(ctx.destination);
                        o.start();
                        o.stop(ctx.currentTime + 0.15);
                        // Second quieter beat
                        setTimeout(() => {
                            const o2 = ctx.createOscillator();
                            const g2 = ctx.createGain();
                            o2.type = 'sine';
                            o2.frequency.value = 60;
                            g2.gain.setValueAtTime(0.1, ctx.currentTime);
                            g2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
                            o2.connect(g2);
                            g2.connect(ctx.destination);
                            o2.start();
                            o2.stop(ctx.currentTime + 0.1);
                        }, 200);
                    };
                    beat();
                    heartbeatInterval = setInterval(beat, 800); // 75bpm
                }

                function stopHeartbeat() {
                    if (heartbeatInterval) {
                        clearInterval(heartbeatInterval);
                        heartbeatInterval = null;
                    }
                }

                // optional background hum (very subtle)
                let bgOn = false;
                let bgNode = null;

                function startBg() {
                    if (bgOn) return;
                    const ctx = getCtx();
                    const o = ctx.createOscillator();
                    const g = ctx.createGain();
                    o.type = "sine";
                    o.frequency.value = 55;
                    g.gain.value = 0.0;
                    o.connect(g);
                    g.connect(ctx.destination);
                    o.start();
                    g.gain.linearRampToValueAtTime(0.02, ctx.currentTime + 0.4);
                    bgOn = true;
                    bgNode = { o, g };
                }

                function stopBg() {
                    if (!bgOn || !bgNode) return;
                    const ctx = getCtx();
                    bgNode.g.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 0.25);
                    bgNode.o.stop(ctx.currentTime + 0.26);
                    bgOn = false;
                    bgNode = null;
                }
                // Background music setup
                let bgMusicStarted = false;
                const bgMusic = new Audio('background.mp3');
                bgMusic.loop = true;
                bgMusic.volume = 0.25;

                window.addEventListener("pointerdown", () => {
                    startBg();
                    if (!bgMusicStarted) {
                        bgMusic.play().catch(() => {});
                        bgMusicStarted = true;
                    }
                }, { once: true });

                const canvas = document.getElementById('c');
                const ctx = canvas.getContext('2d');

                const hpP = document.getElementById('hpP');
                const hpB = document.getElementById('hpB');
                const logEl = document.getElementById('log');

                const ang = document.getElementById('ang');
                const pow = document.getElementById('pow');
                const wind = document.getElementById('wind');
                const angV = document.getElementById('angV');
                const powV = document.getElementById('powV');
                const windV = document.getElementById('windV');

                const shootBtn = document.getElementById('shoot');
                const resetBtn = document.getElementById('reset');
                const moveLBtn = document.getElementById('moveL');
                const moveRBtn = document.getElementById('moveR');

                const W = canvas.width,
                    H = canvas.height;

                // Physics
                const g = 260; // gravity px/s^2
                const windAccelScale = 9; // wind -> horizontal accel px/s^2
                const dt = 1 / 60;

                // Terrain
                let terrain = [];

                function buildTerrain() {
                    // simple hills: random sum of sines
                    terrain = new Array(W);
                    const base = H * (0.68 + Math.random() * 0.08);
                    const a1 = 35 + Math.random() * 28;
                    const a2 = 18 + Math.random() * 22;
                    const a3 = 10 + Math.random() * 16;
                    const f1 = 1.6 + Math.random() * 1.4;
                    const f2 = 3.2 + Math.random() * 2.2;
                    const f3 = 6.0 + Math.random() * 2.8;
                    const p1 = Math.random() * Math.PI * 2;
                    const p2 = Math.random() * Math.PI * 2;
                    const p3 = Math.random() * Math.PI * 2;
                    for (let x = 0; x < W; x++) {
                        const t = x / W * Math.PI * 2;
                        const y = base +
                            a1 * Math.sin(t * f1 + p1) +
                            a2 * Math.sin(t * f2 + p2) +
                            a3 * Math.sin(t * f3 + p3);
                        terrain[x] = Math.min(H - 40, Math.max(H * 0.45, y));
                    }
                }

                function groundY(x) {
                    x = Math.max(0, Math.min(W - 1, Math.floor(x)));
                    return terrain[x];
                }

                // Players
                const player = {
                    x: 120,
                    r: 14,
                    hp: 200,
                    maxHp: 200,
                    facing: 1,
                    stamina: 150,
                    maxStamina: 150
                };
                const bot = {
                    x: W - 120,
                    r: 14,
                    hp: 200,
                    maxHp: 200,
                    facing: -1,
                    stamina: 150,
                    maxStamina: 150
                };

                function placeOnGround(ent) {
                    ent.y = groundY(ent.x) - ent.r - 2;
                }

                // Projectile
                let proj = null;
                let turn = 'player';
                let turnLock = false;
                let windVal = 0;

                // Wind Sweep Up with Dynamic Doppler and Stereo Panning
                let windNode = null;
                let windGain = null;
                let windFilter = null;
                let windPanner = null;
                let windStartTime = 0;
                let initialVy = 0;
                let maxHeightTracked = 0;
                let startX = 0;
                let endX = 0;

                // Clouds - decorative background
                let clouds = [];

                function initClouds() {
                    clouds = [];
                    for (let i = 0; i < 5; i++) {
                        clouds.push({
                            x: Math.random() * W,
                            y: 30 + Math.random() * 100,
                            w: 60 + Math.random() * 80,
                            h: 25 + Math.random() * 20,
                            speed: 0.2 + Math.random() * 0.3
                        });
                    }
                }

                function updateClouds() {
                    for (let c of clouds) {
                        c.x += c.speed;
                        if (c.x > W + c.w) c.x = -c.w;
                    }
                }

                function drawClouds() {
                    ctx.fillStyle = 'rgba(255,255,255,0.08)';
                    for (let c of clouds) {
                        ctx.beginPath();
                        ctx.ellipse(c.x, c.y, c.w / 2, c.h / 2, 0, 0, Math.PI * 2);
                        ctx.fill();
                        ctx.beginPath();
                        ctx.ellipse(c.x + c.w * 0.25, c.y - c.h * 0.2, c.w * 0.4, c.h * 0.6, 0, 0, Math.PI * 2);
                        ctx.fill();
                        ctx.beginPath();
                        ctx.ellipse(c.x - c.w * 0.25, c.y - c.h * 0.1, c.w * 0.35, c.h * 0.5, 0, 0, Math.PI * 2);
                        ctx.fill();
                    }
                }

                // Birds - fly across screen every 10s with sine wave trajectory
                let birds = [];
                let lastBirdSpawn = 0;
                let birdSpawnDelay = 1000 + Math.random() * 4000; // Initial delay 1-5s
                function spawnBird() {
                    const dir = Math.random() > 0.5 ? 1 : -1;
                    const startY = 60 + Math.random() * 100;
                    birds.push({
                        x: dir === 1 ? -40 : W + 40,
                        y: startY,
                        baseY: startY,
                        dir: dir,
                        speed: 1.5 + Math.random() * 1.5,
                        wingPhase: Math.random() * Math.PI * 2,
                        flyPhase: Math.random() * Math.PI * 2,
                        color: `hsl(${30 + Math.random() * 30}, 70%, ${40 + Math.random() * 20}%)`
                    });
                }

                function updateBirds() {
                    const now = Date.now();
                    if (now - lastBirdSpawn > birdSpawnDelay) {
                        spawnBird();
                        lastBirdSpawn = now;
                        birdSpawnDelay = 10000; // Next birds every 10s
                    }
                    for (let i = birds.length - 1; i >= 0; i--) {
                        let b = birds[i];
                        b.x += b.speed * b.dir;
                        b.flyPhase += 0.05;
                        // Sine wave trajectory - up and down
                        b.y = b.baseY + Math.sin(b.flyPhase) * 30;
                        b.wingPhase += 0.3;
                        if ((b.dir === 1 && b.x > W + 60) || (b.dir === -1 && b.x < -60)) {
                            birds.splice(i, 1);
                        }
                    }
                }

                function drawBirds() {
                    for (let b of birds) {
                        ctx.save();
                        ctx.translate(b.x, b.y);
                        if (b.dir === -1) ctx.scale(-1, 1);
                        // Body - 2x bigger (was 10,6 now 20,12)
                        ctx.fillStyle = b.color;
                        ctx.beginPath();
                        ctx.ellipse(0, 0, 20, 12, 0, 0, Math.PI * 2);
                        ctx.fill();
                        // Head - 2x bigger (was 8,-4,5 now 16,-8,10)
                        ctx.beginPath();
                        ctx.arc(16, -8, 10, 0, Math.PI * 2);
                        ctx.fill();
                        // Eye
                        ctx.fillStyle = '#000';
                        ctx.beginPath();
                        ctx.arc(18, -10, 3, 0, Math.PI * 2);
                        ctx.fill();
                        // Beak
                        ctx.fillStyle = '#fa0';
                        ctx.beginPath();
                        ctx.moveTo(24, -8);
                        ctx.lineTo(34, -4);
                        ctx.lineTo(24, 0);
                        ctx.fill();
                        // Wings - animated, 2x bigger
                        const wingY = Math.sin(b.wingPhase) * 12;
                        ctx.fillStyle = `hsl(${35 + Math.random() * 20}, 80%, 50%)`;
                        ctx.beginPath();
                        ctx.moveTo(-4, -4);
                        ctx.quadraticCurveTo(-16, -16 + wingY, -30, -4 + wingY * 0.5);
                        ctx.quadraticCurveTo(-16, 4, -4, 4);
                        ctx.fill();
                        ctx.restore();
                    }
                }

                function startWind() {
                    const ctx = getCtx();
                    const bufferSize = ctx.sampleRate * 3;
                    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
                    const data = buffer.getChannelData(0);
                    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

                    windNode = ctx.createBufferSource();
                    windNode.buffer = buffer;
                    windNode.loop = true;

                    windFilter = ctx.createBiquadFilter();
                    windFilter.type = 'lowpass';
                    windFilter.frequency.value = 100;

                    windGain = ctx.createGain();
                    windGain.gain.value = 0;

                    // Stereo panner
                    windPanner = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
                    if (windPanner) windPanner.pan.value = 0;

                    windNode.connect(windFilter);
                    windFilter.connect(windGain);
                    if (windPanner) {
                        windGain.connect(windPanner);
                        windPanner.connect(ctx.destination);
                    } else {
                        windGain.connect(ctx.destination);
                    }
                    windNode.start();
                    windStartTime = Date.now();

                    if (proj) {
                        initialVy = Math.abs(proj.vy);
                        maxHeightTracked = proj.y;
                        startX = proj.x;
                        // Predict approximate landing X
                        const flightTime = (2 * initialVy) / g;
                        endX = proj.x + proj.vx * flightTime;
                    }
                }

                function updateWind() {
                    if (!windGain || !proj) return;

                    const ctx = getCtx();
                    const vy = proj.vy;
                    const speed = Math.sqrt(proj.vx * proj.vx + vy * vy);
                    const heightAboveGround = H - proj.y;

                    // Track max height
                    if (proj.y < maxHeightTracked) maxHeightTracked = proj.y;

                    // Calculate apex progress: 0=start, 0.5=apex, 1=end
                    const expectedMaxHeight = (initialVy * initialVy) / (2 * g);
                    const hasApexed = proj.y > maxHeightTracked + 10; // Past apex

                    // BASE GAIN - Strong Doppler: high at start, 0 at apex, high at end (50% volume)
                    let baseGain;
                    if (!hasApexed) {
                        // Going UP: gain from 0.125 down to 0
                        const progress = Math.min((H - proj.y) / Math.max(expectedMaxHeight, 100), 1);
                        baseGain = 0.125 * (1 - Math.pow(progress, 3)); // Cubic falloff to 0
                    } else {
                        // Going DOWN: gain from 0 up to 0.125
                        const fallProgress = Math.min((proj.y - maxHeightTracked) / Math.max(expectedMaxHeight, 100), 1);
                        baseGain = 0.125 * Math.pow(fallProgress, 0.5); // Square root rise from 0
                    }

                    // Speed bonus (50% reduced)
                    const speedBonus = Math.min(speed / 300, 1) * 0.075;

                    // Height bonus (50% reduced)
                    const heightRatio = Math.min(heightAboveGround / 300, 1);
                    const heightBonus = heightRatio * 0.05;

                    // Duration fade-in
                    const flightDuration = (Date.now() - windStartTime) / 1000;
                    const fadeIn = Math.min(flightDuration / 0.5, 1);

                    const targetGain = (baseGain + speedBonus + heightBonus) * fadeIn;
                    windGain.gain.setValueAtTime(Math.max(targetGain, 0.001), ctx.currentTime);

                    // Filter sweep
                    const filterFreq = 100 + (heightRatio * 1000) + (Math.min(speed / 200, 1) * 800);
                    windFilter.frequency.setValueAtTime(filterFreq, ctx.currentTime);

                    // STEREO PANNING - Follow projectile across screen
                    if (windPanner) {
                        const pan = ((proj.x / W) * 2) - 1; // -1 (left) to 1 (right)
                        windPanner.pan.setValueAtTime(Math.max(-1, Math.min(1, pan)), ctx.currentTime);
                    }
                }

                function stopWind() {
                    if (windNode) {
                        windNode.stop();
                        windNode.disconnect();
                        windNode = null;
                    }
                    if (windFilter) {
                        windFilter.disconnect();
                        windFilter = null;
                    }
                    if (windGain) {
                        windGain.disconnect();
                        windGain = null;
                    }
                }

                function setLog(t) {
                    logEl.textContent = t;
                }

                function clamp(v, a, b) {
                    return Math.max(a, Math.min(b, v));
                }

                function randn() {
                    return (Math.random() + Math.random() + Math.random() + Math.random() - 2) / 2;
                }

                // Double shot storage
                let lastShotParams = null;
                let doubleShotPending = false;

                function startShot(from, angleDeg, power, dir) {
                    const angRad = angleDeg * Math.PI / 180;
                    const speed = power * 6.2;
                    const vx = Math.cos(angRad) * speed * dir;
                    const vy = -Math.sin(angRad) * speed;

                    // Save for potential double shot
                    lastShotParams = { from, angleDeg, power, dir };

                    proj = {
                        x: from.x,
                        y: from.y - from.r - 2,
                        vx,
                        vy,
                        r: 4,
                        alive: true,
                        owner: (from === player) ? 'player' : 'bot',
                        startTime: Date.now()
                    };
                    startWind();
                }

                function dist2(ax, ay, bx, by) {
                    const dx = ax - bx,
                        dy = ay - by;
                    return dx * dx + dy * dy;
                }

                function explode(atx, aty, impactSpeed = 0) {
                    // Radius with buff
                    let R = 42;
                    const buff = turn === 'player' ? playerBuff : botBuff;
                    if (buff && buff.type === BUFF_TYPES.BIG_RADIUS) {
                        R *= buff.value;
                    }
                    const baseDmg = 38;

                    // Map VERTICAL impact speed (px/s) to multiplier ~[1..4]
                    // High arc => large downward speed => much higher damage.
                    const v = Math.max(0, impactSpeed);
                    let mult = 1 + (v / 147); // ~2x at 147px/s (x1.5 more sensitive)
                    mult = clamp(mult, 1, 4);

                    let totalDmg = baseDmg * mult;

                    // Apply buff x2.5 damage
                    if (buff && buff.type === BUFF_TYPES.DAMAGE_X2_5) {
                        totalDmg *= buff.value;
                    }

                    let maxDmg = 0;
                    const targets = [player, bot];
                    targets.forEach(t => {
                        const d = Math.sqrt(dist2(atx, aty, t.x, t.y));
                        if (d < R) {
                            const dmg = Math.round(totalDmg * (1 - d / R));
                            t.hp = clamp(t.hp - dmg, 0, 999);
                            dmgTexts.push({ x: t.x, y: t.y - t.r - 18, v: dmg, t: 0, tier: (dmg > 100 ? 3 : (dmg >= 80 ? 2 : (dmg >= 60 ? 1 : 0))) });
                            if (dmg > maxDmg) maxDmg = dmg;
                        }
                    });
                    hpP.textContent = player.hp;
                    hpB.textContent = bot.hp;

                    // decide winner
                    if (player.hp <= 0 && bot.hp <= 0) {
                        setLog('Cả hai cùng ngã. Hoà. Reset để chơi lại.');
                        turnLock = true;
                    } else if (player.hp <= 0) {
                        setLog('Bạn thua rồi. Reset để chơi lại.');
                        turnLock = true;
                    } else if (bot.hp <= 0) {
                        setLog('Bạn thắng! Reset để chơi lại.');
                        turnLock = true;
                    }

                    // visual flash
                    flashes.push({
                        x: atx,
                        y: aty,
                        t: 0
                    });
                    return maxDmg;
                }

                // simple effects
                const flashes = [];
                const dmgTexts = [];
                let shakeT = 0;
                let shakeAmp = 0;

                // Buff system for hitting birds
                let playerBuff = null; // {type, turnsLeft, value}
                let botBuff = null;
                const BUFF_TYPES = {
                    DAMAGE_X2_5: 'dmg2.5',
                    DOUBLE_SHOT: 'double',
                    EXTRA_TURNS: 'extra',
                    BIG_RADIUS: 'big'
                };

                // Hit birds fall and fade
                let fallingBirds = [];

                function checkProjHitBird() {
                    if (!proj || !proj.alive) return false;
                    for (let i = birds.length - 1; i >= 0; i--) {
                        let b = birds[i];
                        const dx = proj.x - b.x;
                        const dy = proj.y - b.y;
                        const dist = Math.sqrt(dx * dx + dy * dy);
                        if (dist < 20) { // Hit radius
                            // Bird falls
                            fallingBirds.push({
                                x: b.x,
                                y: b.y,
                                vx: proj.vx * 0.3,
                                vy: -50,
                                color: b.color,
                                wingPhase: b.wingPhase,
                                alpha: 1
                            });
                            birds.splice(i, 1);
                            // Explode projectile
                            proj.alive = false;
                            stopWind();
                            // Give buff to shooter
                            giveBuff(turn === 'player' ? 'player' : 'bot');
                            endShot('bird');
                            return true;
                        }
                    }
                    return false;
                }

                function giveBuff(target) {
                    const buffs = Object.values(BUFF_TYPES);
                    const buff = buffs[Math.floor(Math.random() * buffs.length)];
                    const buffData = { type: buff, turnsLeft: 1 };
                    switch (buff) {
                        case BUFF_TYPES.DAMAGE_X2_5:
                            buffData.value = 2.5;
                            break;
                        case BUFF_TYPES.DOUBLE_SHOT:
                            buffData.value = 2;
                            break;
                        case BUFF_TYPES.EXTRA_TURNS:
                            buffData.value = 2;
                            break;
                        case BUFF_TYPES.BIG_RADIUS:
                            buffData.value = 3;
                            break;
                    }
                    if (target === 'player') {
                        playerBuff = buffData;
                        setLog(`🎯 Trúng chim! Item: ${getBuffName(buff)}`);
                    } else {
                        botBuff = buffData;
                    }
                }

                function getBuffName(buff) {
                    switch (buff) {
                        case BUFF_TYPES.DAMAGE_X2_5:
                            return 'Sát thương x2.5';
                        case BUFF_TYPES.DOUBLE_SHOT:
                            return 'Bắn 2 phát';
                        case BUFF_TYPES.EXTRA_TURNS:
                            return 'Thêm 2 lượt';
                        case BUFF_TYPES.BIG_RADIUS:
                            return 'Đạn to x3';
                    }
                }

                function updateFallingBirds() {
                    for (let i = fallingBirds.length - 1; i >= 0; i--) {
                        let b = fallingBirds[i];
                        b.x += b.vx * dt;
                        b.y += b.vy * dt;
                        b.vy += g * dt;
                        b.alpha -= 0.02;
                        b.wingPhase += 0.5;
                        if (b.alpha <= 0 || b.y > H) {
                            fallingBirds.splice(i, 1);
                        }
                    }
                }

                function drawFallingBirds() {
                    for (let b of fallingBirds) {
                        ctx.save();
                        ctx.globalAlpha = b.alpha;
                        ctx.translate(b.x, b.y);
                        ctx.rotate(b.vy * 0.01);
                        ctx.fillStyle = b.color;
                        ctx.beginPath();
                        ctx.ellipse(0, 0, 10, 6, 0, 0, Math.PI * 2);
                        ctx.fill();
                        const wingY = Math.sin(b.wingPhase) * 5;
                        ctx.fillStyle = '#fa0';
                        ctx.beginPath();
                        ctx.moveTo(-2, -2);
                        ctx.quadraticCurveTo(-8, -8 + wingY, -15, -2 + wingY * 0.5);
                        ctx.quadraticCurveTo(-8, 2, -2, 2);
                        ctx.fill();
                        ctx.restore();
                    }
                }

                function step() {
                    updateClouds();
                    updateBirds();
                    updateFallingBirds();
                    // update projectile
                    if (proj && proj.alive) {
                        // Check hit bird first
                        if (checkProjHitBird()) {
                            proj = null;
                        } else {

                            // wind as horizontal acceleration
                            // wind as horizontal acceleration
                            const ax = windVal * windAccelScale;
                            proj.vx += ax * dt;
                            proj.vy += g * dt;
                            proj.x += proj.vx * dt;
                            proj.y += proj.vy * dt;

                            // Update whoosh sound volume while flying
                            updateWind();

                            // out of bounds
                            if (proj.x < -50 || proj.x > W + 50 || proj.y > H + 80) {
                                proj.alive = false;
                                proj = null;
                                stopWind();
                                endShot(null);
                            } else {
                                // hit ground
                                const gy = groundY(proj.x);
                                if (proj.y + proj.r >= gy) {
                                    const hitX = proj.x;
                                    const hitY = gy;
                                    // Use vertical impact speed only: high lob (big fall) => much higher damage
                                    const impactSpeed = Math.max(0, proj.vy);
                                    proj.alive = false;
                                    proj = null;
                                    const maxDmg = explode(hitX, hitY, impactSpeed);
                                    stopWind();
                                    sfxBoom(maxDmg);
                                    if (maxDmg >= 60) {
                                        shakeT = 0.32;
                                        shakeAmp = (maxDmg > 100) ? 16 : (maxDmg >= 80 ? 10 : 6);
                                    }
                                    endShot('ground');
                                } else {
                                    // hit player/bot
                                    const targets = [player, bot];
                                    for (const t of targets) {
                                        if (t.hp <= 0) continue;
                                        const rr = (t.r + proj.r);
                                        if (dist2(proj.x, proj.y, t.x, t.y) <= rr * rr) {
                                            const hitX = proj.x;
                                            const hitY = proj.y;
                                            // Use vertical impact speed only: high lob (big fall) => much higher damage
                                            const impactSpeed = Math.max(0, proj.vy);
                                            proj.alive = false;
                                            proj = null;
                                            const maxDmg = explode(hitX, hitY, impactSpeed);
                                            stopWind();
                                            sfxBoom(maxDmg);
                                            if (maxDmg >= 60) {
                                                shakeT = 0.32;
                                                shakeAmp = (maxDmg > 100) ? 16 : (maxDmg >= 80 ? 10 : 6);
                                            }
                                            endShot('body');
                                            break;
                                        }
                                    }
                                }
                            }
                        }

                        // effects
                        for (let i = flashes.length - 1; i >= 0; i--) {
                            flashes[i].t += dt;
                            if (flashes[i].t > 0.35) flashes.splice(i, 1);
                        }

                        for (let i = dmgTexts.length - 1; i >= 0; i--) {
                            dmgTexts[i].t += dt;
                            dmgTexts[i].y -= 18 * dt;
                            if (dmgTexts[i].t > 0.9) dmgTexts.splice(i, 1);
                        }

                        if (shakeT > 0) {
                            shakeT -= dt;
                            if (shakeT < 0) shakeT = 0;
                        }

                        draw();
                        requestAnimationFrame(step);
                    }

                    function endShot(reason) {
                        if (turnLock) {
                            shootBtn.disabled = true;
                            return;
                        }

                        // Check for double shot buff
                        const currentBuff = turn === 'player' ? playerBuff : botBuff;
                        if (currentBuff && currentBuff.type === BUFF_TYPES.DOUBLE_SHOT && !doubleShotPending && lastShotParams) {
                            doubleShotPending = true;
                            // Fire second shot with same params
                            setTimeout(() => {
                                const p = lastShotParams;
                                startShot(p.from, p.angleDeg, p.power, p.dir);
                                if (turn === 'player') setLog('🎯 Bắn phát thứ 2!');
                            }, 300);
                            return;
                        }

                        doubleShotPending = false;
                        lastShotParams = null;

                        // Check for extra turns buff
                        if (currentBuff && currentBuff.type === BUFF_TYPES.EXTRA_TURNS && currentBuff.value > 0) {
                            currentBuff.value--;
                            if (currentBuff.value >= 0) {
                                if (turn === 'player') {
                                    setLog(`🎯 Lượt thêm! Còn ${currentBuff.value + 1} lượt.`);
                                    player.stamina = player.maxStamina;
                                    shootBtn.disabled = false;
                                } else {
                                    bot.stamina = bot.maxStamina;
                                    setTimeout(botTurn, 800);
                                }
                                return;
                            }
                        }

                        // Clear all buffs after turn
                        if (turn === 'player') playerBuff = null;
                        else botBuff = null;

                        // adjust wind slightly each turn
                        windVal = clamp(windVal + randn() * 2.2, -3.0, 3.0);
                        wind.value = Math.round(windVal * 10);
                        windV.textContent = windVal.toFixed(1);

                        if (turn === 'player') {
                            turn = 'bot';
                            shootBtn.disabled = true;
                            bot.stamina = bot.maxStamina;
                            setLog('Lượt của bot...');
                            setTimeout(botTurn, 650);
                        } else {
                            turn = 'player';
                            shootBtn.disabled = false;
                            player.stamina = player.maxStamina;
                            setLog('Lượt của bạn. Chỉnh góc/lực rồi bắn.');
                        }
                    }

                    function botTurn() {
                        if (turnLock) return;

                        const target = player;
                        const from = bot;
                        const dir = -1;

                        // High-resolution search with wind compensation for ~70% accuracy
                        let candidates = [];

                        // Try different strategies: direct, lob (high arc), medium
                        const strategies = [{
                                aMin: 22,
                                aMax: 48,
                                aStep: 1.0,
                                pMin: 55,
                                pMax: 95,
                                pStep: 1.8
                            }, // Direct
                            {
                                aMin: 58,
                                aMax: 82,
                                aStep: 0.8,
                                pMin: 70,
                                pMax: 100,
                                pStep: 2.0
                            }, // High lob (over terrain)
                            {
                                aMin: 35,
                                aMax: 60,
                                aStep: 1.2,
                                pMin: 45,
                                pMax: 85,
                                pStep: 2.0
                            } // Medium arc
                        ];

                        for (const strat of strategies) {
                            for (let a = strat.aMin; a <= strat.aMax; a += strat.aStep) {
                                for (let p = strat.pMin; p <= strat.pMax; p += strat.pStep) {
                                    const sim = simulateShot(from, a, p, dir, 3.2);
                                    if (!sim || sim.out) continue;

                                    // Target center
                                    const tx = target.x;
                                    const ty = target.y;
                                    const dx = sim.x - tx;
                                    const dy = sim.y - ty;
                                    const dist = Math.sqrt(dx * dx + dy * dy);

                                    // Heavy penalty for hitting ground before reaching near target
                                    const earlyPenalty = (sim.ground && sim.x < target.x - 80) ? 200 : 0;
                                    // Small bonus for being close to target height
                                    const heightBonus = Math.abs(sim.y - ty) < 30 ? -10 : 0;

                                    const score = dist + earlyPenalty + heightBonus;
                                    candidates.push({
                                        a,
                                        p,
                                        score,
                                        dist
                                    });
                                }
                            }
                        }

                        if (candidates.length === 0) {
                            startShot(bot, 55, 80, dir);
                            sfxShoot();
                            setLog('Bot bắn (fallback)');
                            return;
                        }

                        // Sort by score (best shots first)
                        candidates.sort((a, b) => a.score - b.score);

                        // Pick THE BEST shot (index 0) - for near-perfect accuracy
                        const pick = candidates[0];

                        // Apply minimal error (~98% accuracy): only ±2% error
                        const accuracyError = 0.02; // 2% error for ~98% accuracy (almost perfect)
                        const errA = (Math.random() - 0.5) * 2 * accuracyError * pick.a;
                        const errP = (Math.random() - 0.5) * 2 * accuracyError * pick.p;

                        // Additional check: re-simulate to ensure it clears terrain
                        let a2 = clamp(pick.a + errA, 10, 85);
                        let p2 = clamp(pick.p + errP, 10, 100);

                        startShot(bot, a2, p2, dir);
                        sfxShoot();
                        setLog(`Bot bắn: góc ${a2.toFixed(0)}°, lực ${p2.toFixed(0)} (gió ${windVal.toFixed(1)})`);
                    }

                    function simulateShot(from, angleDeg, power, dir, maxT = 1.4) {
                        const angRad = angleDeg * Math.PI / 180;
                        const speed = power * 6.2;
                        // Start from center of character (matching startShot)
                        let x = from.x;
                        let y = from.y - from.r - 2;
                        let vx = Math.cos(angRad) * speed * dir;
                        let vy = -Math.sin(angRad) * speed;
                        let t = 0;
                        const step = 1 / 60;
                        while (t < maxT) {
                            const ax = windVal * windAccelScale;
                            vx += ax * step;
                            vy += g * step;
                            x += vx * step;
                            y += vy * step;
                            if (x < -50 || x > W + 50 || y > H + 80) return {
                                x,
                                y,
                                out: true
                            };
                            const gy = groundY(x);
                            if (y >= gy) return {
                                x,
                                y: gy,
                                ground: true
                            };
                            t += step;
                        }
                        return {
                            x,
                            y,
                            timeout: true
                        };
                    }

                    function drawTerrain() {
                        ctx.beginPath();
                        ctx.moveTo(0, H);
                        for (let x = 0; x < W; x++) ctx.lineTo(x, terrain[x]);
                        ctx.lineTo(W, H);
                        ctx.closePath();
                        // fill
                        const grad = ctx.createLinearGradient(0, H * 0.5, 0, H);
                        grad.addColorStop(0, 'rgba(255,45,45,.10)');
                        grad.addColorStop(1, 'rgba(255,255,255,.03)');
                        ctx.fillStyle = grad;
                        ctx.fill();
                        ctx.strokeStyle = 'rgba(255,255,255,.08)';
                        ctx.stroke();
                    }

                    function drawPlayer(ent, color) {
                        // Chibi character lying down (Gunny style)
                        const x = ent.x,
                            y = ent.y,
                            r = ent.r;
                        const facing = ent.facing;

                        // Body (ellipse lying down)
                        ctx.fillStyle = color;
                        ctx.beginPath();
                        ctx.ellipse(x, y, r * 1.3, r * 0.6, 0, 0, Math.PI * 2);
                        ctx.fill();

                        // Head (circle on one side)
                        ctx.beginPath();
                        ctx.arc(x + facing * r * 0.8, y - r * 0.3, r * 0.5, 0, Math.PI * 2);
                        ctx.fill();

                        // Eyes
                        ctx.fillStyle = 'rgba(0,0,0,0.6)';
                        ctx.beginPath();
                        ctx.arc(x + facing * r * 0.9, y - r * 0.35, r * 0.12, 0, Math.PI * 2);
                        ctx.fill();

                        // Legs (small ellipses)
                        ctx.fillStyle = color;
                        ctx.beginPath();
                        ctx.ellipse(x - facing * r * 1.1, y + r * 0.2, r * 0.4, r * 0.25, 0, 0, Math.PI * 2);
                        ctx.fill();

                        // Arms holding cannon
                        ctx.strokeStyle = color;
                        ctx.lineWidth = r * 0.25;
                        ctx.lineCap = 'round';
                        ctx.beginPath();
                        ctx.moveTo(x + facing * r * 0.3, y);
                        ctx.lineTo(x + facing * (r + 8), y - 8);
                        ctx.stroke();

                        // Cannon
                        ctx.strokeStyle = 'rgba(80,80,80,0.9)';
                        ctx.lineWidth = 4;
                        ctx.beginPath();
                        ctx.moveTo(x + facing * r * 0.5, y - r * 0.2);
                        ctx.lineTo(x + facing * (r + 16), y - 12);
                        ctx.stroke();

                        // HP bar
                        const w = 60,
                            h = 7;
                        const x0 = ent.x - w / 2;
                        const y0 = ent.y - ent.r - 22;
                        ctx.fillStyle = 'rgba(0,0,0,.35)';
                        ctx.fillRect(x0, y0, w, h);
                        ctx.fillStyle = 'rgba(255,45,45,.75)';
                        const pct = clamp(ent.hp / ent.maxHp, 0, 1);
                        ctx.fillRect(x0, y0, w * pct, h);
                        ctx.strokeStyle = 'rgba(255,255,255,.18)';
                        ctx.strokeRect(x0, y0, w, h);

                        // stamina bar (below hp)
                        if (ent.stamina !== undefined) {
                            const stY = y0 + h + 3;
                            const stH = 4;
                            ctx.fillStyle = 'rgba(0,0,0,.35)';
                            ctx.fillRect(x0, stY, w, stH);
                            ctx.fillStyle = 'rgba(180,180,180,.85)';
                            const stPct = clamp(ent.stamina / ent.maxStamina, 0, 1);
                            ctx.fillRect(x0, stY, w * stPct, stH);
                            ctx.strokeStyle = 'rgba(255,255,255,.12)';
                            ctx.strokeRect(x0, stY, w, stH);
                        }
                    }

                    function drawWind() {
                        ctx.save();
                        ctx.translate(W / 2, 36);
                        ctx.fillStyle = 'rgba(0,0,0,.35)';
                        ctx.strokeStyle = 'rgba(255,255,255,.12)';
                        ctx.lineWidth = 1;
                        ctx.beginPath();
                        ctx.roundRect(-140, -16, 280, 32, 14);
                        ctx.fill();
                        ctx.stroke();

                        ctx.fillStyle = 'rgba(233,238,252,.9)';
                        ctx.font = '12px system-ui';
                        const s = `Gió: ${windVal.toFixed(1)} (m/s giả lập)`;
                        ctx.fillText(s, -ctx.measureText(s).width / 2, 5);

                        // arrow
                        const len = clamp(Math.abs(windVal) * 40, 0, 120);
                        const dir = Math.sign(windVal);
                        ctx.strokeStyle = dir === 0 ? 'rgba(255,255,255,.15)' : 'rgba(124,92,255,.75)';
                        ctx.lineWidth = 3;
                        ctx.beginPath();
                        ctx.moveTo(0, 14);
                        ctx.lineTo(dir * len, 14);
                        ctx.stroke();
                        if (dir !== 0) {
                            ctx.beginPath();
                            ctx.moveTo(dir * len, 14);
                            ctx.lineTo(dir * len - dir * 10, 8);
                            ctx.lineTo(dir * len - dir * 10, 20);
                            ctx.closePath();
                            ctx.fillStyle = 'rgba(124,92,255,.75)';
                            ctx.fill();
                        }
                        ctx.restore();
                    }

                    // polyfill roundRect for older browsers
                    if (!CanvasRenderingContext2D.prototype.roundRect) {
                        CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, r) {
                            r = Math.min(r, w / 2, h / 2);
                            this.beginPath();
                            this.moveTo(x + r, y);
                            this.arcTo(x + w, y, x + w, y + h, r);
                            this.arcTo(x + w, y + h, x, y + h, r);
                            this.arcTo(x, y + h, x, y, r);
                            this.arcTo(x, y, x + w, y, r);
                            this.closePath();
                            return this;
                        }
                    }

                    function drawAimPreview() {
                        // show predicted arc for player's current settings when it's player's turn and not firing
                        if (turnLock || turn !== 'player' || proj) return;

                        const angleDeg = parseFloat(ang.value);
                        const power = parseFloat(pow.value);
                        const dir = +1;
                        const angRad = angleDeg * Math.PI / 180;
                        const speed = power * 6.2;

                        // Start from center of character
                        let x = player.x;
                        let y = player.y - player.r - 2;
                        let vx = Math.cos(angRad) * speed * dir;
                        let vy = -Math.sin(angRad) * speed;

                        ctx.save();
                        ctx.strokeStyle = 'rgba(233, 238, 252, 0.25)';
                        ctx.lineWidth = 2;
                        ctx.setLineDash([6, 6]);
                        ctx.beginPath();
                        ctx.moveTo(x, y);

                        // simulate until impact/out (cap steps)
                        const step = 1 / 60;
                        let didImpact = false;
                        for (let i = 0; i < 220; i++) {
                            const ax = windVal * windAccelScale;
                            vx += ax * step;
                            vy += g * step;
                            x += vx * step;
                            y += vy * step;

                            if (x < 0 || x >= W || y > H) break;
                            const gy = groundY(x);
                            if (y >= gy) {
                                // impact point
                                ctx.lineTo(x, gy);
                                didImpact = true;
                                // keep arc visible, then mark point
                                ctx.stroke();
                                ctx.setLineDash([]);
                                ctx.fillStyle = 'rgba(124,92,255,0.55)';
                                ctx.beginPath();
                                ctx.arc(x, gy, 5, 0, Math.PI * 2);
                                ctx.fill();
                                ctx.restore();
                                return;
                            }
                            ctx.lineTo(x, y);
                        }

                        // if no impact yet, still draw the partial arc
                        ctx.stroke();
                        ctx.restore();
                    }

                    function draw() {
                        ctx.clearRect(0, 0, W, H);

                        // Clouds (background)
                        drawClouds();
                        drawBirds();
                        drawFallingBirds();

                        // Heartbeat when HP < 50
                        if (player.hp < 50 && player.hp > 0 && !turnLock) startHeartbeat();
                        else stopHeartbeat();

                        // screen shake
                        if (shakeT > 0) {
                            const k = shakeT / 0.32;
                            const amp = shakeAmp * k;
                            ctx.save();
                            ctx.translate((Math.random() * 2 - 1) * amp, (Math.random() * 2 - 1) * amp);
                        }

                        // sky stars
                        ctx.fillStyle = 'rgba(255,255,255,.16)';
                        for (let i = 0; i < 40; i++) {
                            const x = (i * 97) % W;
                            const y = (i * 53) % Math.floor(H * 0.45);
                            ctx.fillRect(x, y, 1, 1);
                        }

                        drawWind();
                        drawTerrain();

                        // aiming preview (player)
                        drawAimPreview();

                        // players
                        drawPlayer(player, 'rgba(255,255,255,.90)');
                        drawPlayer(bot, 'rgba(255,45,45,.85)');

                        // projectile
                        if (proj) {
                            ctx.fillStyle = 'rgba(255,255,255,.85)';
                            ctx.beginPath();
                            ctx.arc(proj.x, proj.y, proj.r, 0, Math.PI * 2);
                            ctx.fill();

                            // trail
                            ctx.strokeStyle = 'rgba(255,255,255,.18)';
                            ctx.lineWidth = 2;
                            ctx.beginPath();
                            ctx.moveTo(proj.x, proj.y);
                            ctx.lineTo(proj.x - proj.vx * 0.03, proj.y - proj.vy * 0.03);
                            ctx.stroke();
                        }

                        // explosions
                        for (const f of flashes) {
                            const p = f.t / 0.35;
                            const r = 10 + p * 55;
                            ctx.fillStyle = `rgba(255,200,120,${0.22*(1-p)})`;
                            ctx.beginPath();
                            ctx.arc(f.x, f.y, r, 0, Math.PI * 2);
                            ctx.fill();
                            ctx.strokeStyle = `rgba(255,255,255,${0.25*(1-p)})`;
                            ctx.stroke();
                        }

                        // floating damage texts
                        ctx.font = 'bold 14px system-ui';
                        ctx.textAlign = 'center';
                        for (const d of dmgTexts) {
                            const a = 1 - (d.t / 0.9);
                            let col = '255,230,170';
                            if (d.tier === 3) col = '255,45,45';
                            else if (d.tier === 2) col = '255,160,60';
                            else if (d.tier === 1) col = '255,235,120';
                            ctx.fillStyle = `rgba(${col},${a})`;
                            ctx.strokeStyle = `rgba(0,0,0,${0.35*a})`;
                            ctx.lineWidth = 3;
                            const text = `-${d.v}`;
                            ctx.strokeText(text, d.x, d.y);
                            ctx.fillText(text, d.x, d.y);
                        }
                        ctx.textAlign = 'start';

                        if (shakeT > 0) ctx.restore();

                        // HUD turn
                        ctx.fillStyle = 'rgba(0,0,0,.28)';
                        ctx.strokeStyle = 'rgba(255,255,255,.12)';
                        ctx.lineWidth = 1;
                        ctx.roundRect(12, 56, 210, 36, 12);
                        ctx.fill();
                        ctx.stroke();
                        ctx.fillStyle = 'rgba(233,238,252,.9)';
                        ctx.font = '12px system-ui';
                        ctx.fillText(`Lượt: ${turn === 'player' ? 'Bạn' : 'Bot'}`, 24, 78);
                    }

                    function randomSky() {
                        // cohesive red/black sky themes
                        const skies = [
                            'linear-gradient(#060607, #14060a 60%, #0b0b0d)',
                            'linear-gradient(#070709, #1a070c 60%, #0b0b0e)',
                            'linear-gradient(#050506, #110407 60%, #09090c)',
                            'linear-gradient(#09090c, #1b050a 58%, #0b0b0d)',
                            'radial-gradient(800px 520px at 25% 20%, rgba(255,45,45,.22), transparent 62%), linear-gradient(#060607, #12060a 60%, #0b0b0d)'
                        ];
                        document.documentElement.style.setProperty('--sky', skies[(Math.random() * skies.length) | 0]);
                    }

                    function resetAll() {
                        randomSky();
                        buildTerrain();
                        placeOnGround(player);
                        placeOnGround(bot);
                        player.hp = player.maxHp;
                        bot.hp = bot.maxHp;
                        player.stamina = player.maxStamina;
                        bot.stamina = bot.maxStamina;
                        hpP.textContent = player.hp;
                        hpB.textContent = bot.hp;

                        proj = null;
                        turn = 'player';
                        turnLock = false;
                        shootBtn.disabled = false;

                        windVal = 0;
                        wind.value = 0;
                        windV.textContent = '0.0';

                        setLog('Lượt của bạn. Chỉnh góc/lực rồi bắn.');
                        initClouds();
                        lastBirdSpawn = Date.now();
                    }

                    // UI bindings + keyboard
                    function syncLabels() {
                        angV.textContent = ang.value;
                        powV.textContent = pow.value;
                        windVal = clamp(parseInt(wind.value, 10) / 10, -3.0, 3.0);
                        windV.textContent = windVal.toFixed(1);
                    }
                    ang.addEventListener('input', () => {
                        syncLabels();
                        const a = parseFloat(ang.value);
                        if (a >= 75) setLog('💡 Góc ' + a.toFixed(0) + '° siêu cao! Đạn rơi mạnh = sát thương cực đại!');
                        else if (a >= 60) setLog('💡 Góc ' + a.toFixed(0) + '° cao. Sát thương sẽ rất lớn khi đạn rơi!');
                        else setLog('💡 Bắn với góc cao để tối đa sát thương!');
                    });
                    pow.addEventListener('input', syncLabels);
                    wind.addEventListener('input', syncLabels);
                    syncLabels();

                    // Keyboard:
                    // - LEFT/RIGHT: move player along terrain
                    // - UP/DOWN: adjust angle
                    // - Shift + UP/DOWN: adjust power
                    // - Space: shoot

                    let moveInterval = null;
                    const MOVE_COST = 8; // stamina per step
                    const MOVE_STEP = 6; // pixels per move
                    const MOVE_DELAY = 80; // ms between moves when holding

                    function canMove() {
                        return !turnLock && turn === 'player' && !proj && player.stamina > 0;
                    }

                    function doMove(dx) {
                        if (!canMove()) return false;
                        if (player.stamina < MOVE_COST) {
                            setLog('Hết thể lực! Không thể di chuyển.');
                            return false;
                        }
                        player.stamina -= MOVE_COST;
                        player.x = clamp(player.x + dx, 40, W - 40);
                        placeOnGround(player);
                        sfxStep(); // Footstep sound
                        return true;
                    }

                    function startMoving(dx) {
                        if (moveInterval) return;
                        if (!canMove() || player.stamina < MOVE_COST) {
                            setLog('Hết thể lực!');
                            return;
                        }
                        doMove(dx);
                        moveInterval = setInterval(() => {
                            if (!canMove() || player.stamina < MOVE_COST) {
                                stopMoving();
                                if (player.stamina < MOVE_COST) setLog('Hết thể lực!');
                                return;
                            }
                            doMove(dx);
                        }, MOVE_DELAY);
                    }

                    function stopMoving() {
                        if (moveInterval) {
                            clearInterval(moveInterval);
                            moveInterval = null;
                        }
                    }

                    window.addEventListener('keydown', (e) => {
                        if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;

                        if (e.key === 'ArrowLeft') {
                            if (!moveInterval) startMoving(-MOVE_STEP);
                            e.preventDefault();
                            return;
                        }
                        if (e.key === 'ArrowRight') {
                            if (!moveInterval) startMoving(MOVE_STEP);
                            e.preventDefault();
                            return;
                        }
                        if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                            const isPower = e.shiftKey;
                            const el = isPower ? pow : ang;
                            const step = isPower ? 2 : 1;
                            const v = parseInt(el.value, 10) + (e.key === 'ArrowUp' ? step : -step);
                            el.value = String(clamp(v, parseInt(el.min, 10), parseInt(el.max, 10)));
                            syncLabels();
                            e.preventDefault();
                            return;
                        }
                        if (e.key === ' ') {
                            if (!shootBtn.disabled) shootBtn.click();
                            e.preventDefault();
                            return;
                        }
                    });

                    window.addEventListener('keyup', (e) => {
                        if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                            stopMoving();
                        }
                    });

                    shootBtn.addEventListener('click', () => {
                        if (turnLock || turn !== 'player' || proj) return;
                        const a = parseFloat(ang.value);
                        const p = parseFloat(pow.value);
                        startShot(player, a, p, +1);
                        sfxShoot();
                        setLog(`Bạn bắn: góc ${a.toFixed(0)}°, lực ${p.toFixed(0)} (gió ${windVal.toFixed(1)})`);
                    });

                    resetBtn.addEventListener('click', resetAll);

                    // Hold-to-move for buttons (mouse + touch)
                    function setupHoldBtn(btn, dx) {
                        const start = (e) => {
                            e.preventDefault();
                            startMoving(dx);
                        };
                        const stop = (e) => {
                            e.preventDefault();
                            stopMoving();
                        };
                        btn.addEventListener('mousedown', start);
                        btn.addEventListener('mouseup', stop);
                        btn.addEventListener('mouseleave', stop);
                        btn.addEventListener('touchstart', start, { passive: false });
                        btn.addEventListener('touchend', stop);
                        btn.addEventListener('touchcancel', stop);
                    }

                    setupHoldBtn(moveLBtn, -MOVE_STEP);
                    setupHoldBtn(moveRBtn, MOVE_STEP);

                    // init
                    resetAll();
                    step();
                })();