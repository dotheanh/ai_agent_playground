document.addEventListener('DOMContentLoaded', () => {
            // --- SFX (procedural WebAudio) ---
            let audioCtx = null;
            function getCtx(){
                if(!audioCtx){
                    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                }
                if(audioCtx.state === "suspended") audioCtx.resume();
                return audioCtx;
            }
            function beep(freq=440, dur=0.08, type="sine", gain=0.12){
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
                g.gain.linearRampToValueAtTime(gain, t+0.005);
                g.gain.exponentialRampToValueAtTime(0.0001, t+dur);
                o.start(t);
                o.stop(t+dur);
            }
            function noiseBurst(dur=0.18, gain=0.18){
                const ctx = getCtx();
                const bufferSize = Math.floor(ctx.sampleRate * dur);
                const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
                const data = buffer.getChannelData(0);
                for(let i=0;i<bufferSize;i++) data[i] = (Math.random()*2-1) * Math.pow(1 - i/bufferSize, 2);
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
            function sfxShoot(){ beep(820, 0.06, "square", 0.08); beep(320, 0.08, "sawtooth", 0.04); }
            
            // Tick-tock countdown SFX
            function sfxTick(urgent=false){
                // Higher pitch + shorter when urgent
                const f1 = urgent ? 1200 : 800;
                const f2 = urgent ? 900 : 520;
                beep(f1, urgent ? 0.03 : 0.045, "square", urgent ? 0.15 : 0.105);
                beep(f2, urgent ? 0.02 : 0.03, "sine", urgent ? 0.09 : 0.06);
            }
            
            // Doppler hit SFX (like sound-demo)
            function sfxDopplerHit(){
                const ctx = getCtx();
                const o = ctx.createOscillator();
                const g = ctx.createGain();
                o.type = 'sine';
                const t = ctx.currentTime;
                g.gain.setValueAtTime(0, t);
                g.gain.linearRampToValueAtTime(0.18, t + 0.02);
                g.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
                // Frequency sweep down-up to mimic doppler pass
                o.frequency.setValueAtTime(1400, t);
                o.frequency.exponentialRampToValueAtTime(500, t + 0.18);
                o.frequency.exponentialRampToValueAtTime(900, t + 0.6);
                o.connect(g);
                g.connect(ctx.destination);
                o.start(t);
                o.stop(t + 0.65);
            }

            // Turn start whistle (to, rõ)
            function sfxTurnWhistle(){
                const ctx = getCtx();
                const o = ctx.createOscillator();
                const g = ctx.createGain();
                o.type = 'sine';
                const t = ctx.currentTime;
                g.gain.setValueAtTime(0, t);
                g.gain.linearRampToValueAtTime(0.25, t + 0.02);
                g.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
                o.frequency.setValueAtTime(900, t);
                o.frequency.exponentialRampToValueAtTime(1800, t + 0.15);
                o.frequency.exponentialRampToValueAtTime(1100, t + 0.6);
                o.connect(g); g.connect(ctx.destination);
                o.start(t); o.stop(t + 0.65);
            }
            function sfxFly(){ beep(520, 0.05, "triangle", 0.03); }
            function sfxBoom(dmg=0){
                if(dmg > 90){
                    // MEGA Explosion - x3 volume, longer decay
                    const ctx = getCtx();
                    const bufferSize = ctx.sampleRate * 1.2;
                    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
                    const data = buffer.getChannelData(0);
                    let lastOut = 0;
                    for(let i=0; i<bufferSize; i++){
                        const white = Math.random()*2-1;
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
                } else if(dmg >= 70){
                    // Swoosh lao nhanh
                    const ctx = getCtx();
                    const bufferSize = ctx.sampleRate * 0.4;
                    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
                    const data = buffer.getChannelData(0);
                    for(let i=0; i<bufferSize; i++){
                        data[i] = (Math.random()*2-1) * Math.pow(1 - i/bufferSize, 3);
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
                } else if(dmg >= 50){
                    // Shotgun blast
                    const ctx = getCtx();
                    const bufferSize = ctx.sampleRate * 0.1;
                    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
                    const data = buffer.getChannelData(0);
                    for(let i=0; i<bufferSize; i++) data[i] = Math.random()*2-1;
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
                    for(let i=0; i<bufferSize; i++) data[i] = Math.random()*2-1;
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
            function sfxStep(){
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
            function startHeartbeat(){
                if(heartbeatInterval) return;
                const beat = () => {
                    const ctx = getCtx();
                    if(!ctx) return;
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
            function stopHeartbeat(){
                if(heartbeatInterval){
                    clearInterval(heartbeatInterval);
                    heartbeatInterval = null;
                }
            }

            // optional background hum (very subtle)
            let bgOn = false;
            let bgNode = null;
            function startBg(){
                if(bgOn) return;
                const ctx = getCtx();
                const o = ctx.createOscillator();
                const g = ctx.createGain();
                o.type = "sine";
                o.frequency.value = 55;
                g.gain.value = 0.0;
                o.connect(g);
                g.connect(ctx.destination);
                o.start();
                g.gain.linearRampToValueAtTime(0.02, ctx.currentTime+0.4);
                bgOn = true;
                bgNode = {o,g};
            }
            function stopBg(){
                if(!bgOn || !bgNode) return;
                const ctx = getCtx();
                bgNode.g.gain.linearRampToValueAtTime(0.0001, ctx.currentTime+0.25);
                bgNode.o.stop(ctx.currentTime+0.26);
                bgOn = false;
                bgNode = null;
            }
            // Background music setup
            let bgMusicStarted = false;
            const bgMusic = new Audio('/gunny/background.mp3');
            bgMusic.loop = true;
            bgMusic.volume = 0.25;
            
            window.addEventListener("pointerdown", () => {
                startBg();
                if(!bgMusicStarted){
                    bgMusic.play().catch(()=>{});
                    bgMusicStarted = true;
                }
            }, {once:true});

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

            const isDev = true; // Dev mode flag - set to false for production
            
            // Dev cheat panel
            // Load config
            let CFG = {
                turnSeconds: 15,
                maxHp: 500,
                baseDamage: 38,
                explosionRadius: 42,
                buffs: { DAMAGE_X2_5: 2.5, BIG_RADIUS: 3, DOUBLE_SHOT_DAMAGE_MULT: 1.5, EXTRA_TURNS: 2 }
            };
            fetch('/gunny/versions/dev/config.json').then(r=>r.json()).then(j=>{CFG=j; applyConfig();}).catch(()=>{});
            function applyConfig(){
                player.maxHp = CFG.maxHp;
                bot.maxHp = CFG.maxHp;
                player.hp = player.maxHp;
                bot.hp = bot.maxHp;
                hpP.textContent = player.hp;
                hpB.textContent = bot.hp;
            }

            // Turn countdown
            let turnTimeLeft = 0;
            let lastTickSec = 0;
            let turnTimerActive = false;
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
                hp: 500,
                maxHp: 500,
                facing: 1,
                stamina: 150,
                maxStamina: 150
            };
            const bot = {
                x: W - 120,
                r: 14,
                hp: 500,
                maxHp: 500,
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
            function initClouds(){
                clouds = [];
                for(let i=0; i<5; i++){
                    clouds.push({
                        x: Math.random() * W,
                        y: 30 + Math.random() * 100,
                        w: 60 + Math.random() * 80,
                        h: 25 + Math.random() * 20,
                        speed: 0.2 + Math.random() * 0.3
                    });
                }
            }
            function updateClouds(){
                for(let c of clouds){
                    c.x += c.speed;
                    if(c.x > W + c.w) c.x = -c.w;
                }
            }
            function drawClouds(){
                ctx.fillStyle = 'rgba(255,255,255,0.08)';
                for(let c of clouds){
                    ctx.beginPath();
                    ctx.ellipse(c.x, c.y, c.w/2, c.h/2, 0, 0, Math.PI*2);
                    ctx.fill();
                    ctx.beginPath();
                    ctx.ellipse(c.x + c.w*0.25, c.y - c.h*0.2, c.w*0.4, c.h*0.6, 0, 0, Math.PI*2);
                    ctx.fill();
                    ctx.beginPath();
                    ctx.ellipse(c.x - c.w*0.25, c.y - c.h*0.1, c.w*0.35, c.h*0.5, 0, 0, Math.PI*2);
                    ctx.fill();
                }
            }
            
            // Birds - fly across screen every 10s with sine wave trajectory
            let birds = [];
            let lastBirdSpawn = 0;
            let birdSpawnDelay = 1000 + Math.random() * 4000; // Initial delay 1-5s
            function spawnBird(){
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
                    color: `hsl(${15 + Math.random() * 25}, 85%, ${55 + Math.random() * 15}%)`
                });
            }
            function updateBirds(){
                const now = Date.now();
                if(now - lastBirdSpawn > birdSpawnDelay){
                    spawnBird();
                    lastBirdSpawn = now;
                    birdSpawnDelay = 10000; // Next birds every 10s
                }
                for(let i = birds.length - 1; i >= 0; i--){
                    let b = birds[i];
                    b.x += b.speed * b.dir;
                    b.flyPhase += 0.05;
                    // Sine wave trajectory - up and down
                    b.y = b.baseY + Math.sin(b.flyPhase) * 30;
                    b.wingPhase += 0.3;
                    if((b.dir === 1 && b.x > W + 60) || (b.dir === -1 && b.x < -60)){
                        birds.splice(i, 1);
                    }
                }
            }
            function drawBirds(){
                const phoenixScale = (CFG && CFG.phoenixSize) || 1;
                for(let b of birds){
                    ctx.save();
                    ctx.translate(b.x, b.y);
                    ctx.scale(phoenixScale, phoenixScale);
                    if(b.dir === -1) ctx.scale(-1, 1);
                    
                    // Fire glow effect
                    ctx.shadowBlur = 20;
                    ctx.shadowColor = 'rgba(255,80,0,0.8)';
                    
                    // Tail fire (phoenix tail)
                    const tailWiggle = Math.sin(b.wingPhase * 2) * 5;
                    const grd = ctx.createLinearGradient(-40, 0, 0, 0);
                    grd.addColorStop(0, 'rgba(255,50,0,0)');
                    grd.addColorStop(0.5, 'rgba(255,100,0,0.6)');
                    grd.addColorStop(1, 'rgba(255,200,0,0.9)');
                    ctx.fillStyle = grd;
                    ctx.beginPath();
                    ctx.moveTo(-10, 0);
                    ctx.lineTo(-50 + tailWiggle, -15);
                    ctx.lineTo(-45 + tailWiggle, 0);
                    ctx.lineTo(-50 + tailWiggle, 15);
                    ctx.fill();
                    
                    // Body gradient (phoenix body)
                    const bodyGrd = ctx.createRadialGradient(0, 0, 0, 0, 0, 25);
                    bodyGrd.addColorStop(0, '#ffdd00');
                    bodyGrd.addColorStop(0.5, '#ff6600');
                    bodyGrd.addColorStop(1, '#cc2200');
                    ctx.fillStyle = bodyGrd;
                    ctx.beginPath();
                    ctx.ellipse(0, 0, 22, 14, 0, 0, Math.PI * 2);
                    ctx.fill();
                    
                    // Head (phoenix head)
                    const headGrd = ctx.createRadialGradient(16, -8, 0, 16, -8, 12);
                    headGrd.addColorStop(0, '#ffee88');
                    headGrd.addColorStop(1, '#ff4400');
                    ctx.fillStyle = headGrd;
                    ctx.beginPath();
                    ctx.arc(16, -8, 11, 0, Math.PI * 2);
                    ctx.fill();
                    
                    // Eye (glowing)
                    ctx.shadowBlur = 10;
                    ctx.shadowColor = '#ffff00';
                    ctx.fillStyle = '#ffff00';
                    ctx.beginPath();
                    ctx.arc(19, -10, 4, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.shadowBlur = 0;
                    
                    // Beak (golden)
                    ctx.fillStyle = '#ffcc00';
                    ctx.beginPath();
                    ctx.moveTo(26, -8);
                    ctx.lineTo(38, -4);
                    ctx.lineTo(26, 0);
                    ctx.fill();
                    
                    // Wings (phoenix wings with fire gradient)
                    const wingY = Math.sin(b.wingPhase) * 15;
                    const wingGrd = ctx.createLinearGradient(-5, -20, -5, 20);
                    wingGrd.addColorStop(0, '#ff2200');
                    wingGrd.addColorStop(0.5, '#ff8800');
                    wingGrd.addColorStop(1, '#ffcc00');
                    ctx.fillStyle = wingGrd;
                    ctx.beginPath();
                    ctx.moveTo(-5, -6);
                    ctx.quadraticCurveTo(-20, -25 + wingY, -40, -8 + wingY * 0.5);
                    ctx.quadraticCurveTo(-25, 0, -40, 8 + wingY * 0.5);
                    ctx.quadraticCurveTo(-20, 25 + wingY, -5, 6);
                    ctx.fill();
                    
                    // Wing fire particles
                    ctx.fillStyle = `rgba(255, ${100 + Math.random() * 100}, 0, ${0.6 + Math.random() * 0.4})`;
                    ctx.beginPath();
                    ctx.arc(-25 + Math.random() * 10, wingY * 0.3, 3, 0, Math.PI * 2);
                    ctx.fill();
                    
                    ctx.restore();
                }
            }
            
            function startWind(){
                const ctx = getCtx();
                const bufferSize = ctx.sampleRate * 3;
                const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
                const data = buffer.getChannelData(0);
                for(let i=0; i<bufferSize; i++) data[i] = Math.random()*2-1;
                
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
                if(windPanner) windPanner.pan.value = 0;
                
                windNode.connect(windFilter);
                windFilter.connect(windGain);
                if(windPanner) {
                    windGain.connect(windPanner);
                    windPanner.connect(ctx.destination);
                } else {
                    windGain.connect(ctx.destination);
                }
                windNode.start();
                windStartTime = Date.now();
                
                if(proj) {
                    initialVy = Math.abs(proj.vy);
                    maxHeightTracked = proj.y;
                    startX = proj.x;
                    // Predict approximate landing X
                    const flightTime = (2 * initialVy) / g;
                    endX = proj.x + proj.vx * flightTime;
                }
            }
            
            function updateWind(){
                if(!windGain || !proj) return;
                
                const ctx = getCtx();
                const vy = proj.vy;
                const speed = Math.sqrt(proj.vx*proj.vx + vy*vy);
                const heightAboveGround = H - proj.y;
                
                // Track max height
                if(proj.y < maxHeightTracked) maxHeightTracked = proj.y;
                
                // Calculate apex progress: 0=start, 0.5=apex, 1=end
                const expectedMaxHeight = (initialVy * initialVy) / (2 * g);
                const hasApexed = proj.y > maxHeightTracked + 10; // Past apex
                
                // BASE GAIN - Strong Doppler: high at start, 0 at apex, high at end (50% volume)
                let baseGain;
                if(!hasApexed) {
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
                const filterFreq = 100 + (heightRatio * 1000) + (Math.min(speed/200, 1) * 800);
                windFilter.frequency.setValueAtTime(filterFreq, ctx.currentTime);
                
                // STEREO PANNING - Follow projectile across screen
                if(windPanner) {
                    const pan = ((proj.x / W) * 2) - 1; // -1 (left) to 1 (right)
                    windPanner.pan.setValueAtTime(Math.max(-1, Math.min(1, pan)), ctx.currentTime);
                }
            }
            
            function stopWind(){
                if(windNode){
                    windNode.stop();
                    windNode.disconnect();
                    windNode = null;
                }
                if(windFilter){
                    windFilter.disconnect();
                    windFilter = null;
                }
                if(windGain){
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
                lastShotParams = {from, angleDeg, power, dir};
                
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
                let R = CFG.explosionRadius;
                const buff = turn === 'player' ? playerBuff : botBuff;
                if(buff && buff.type === BUFF_TYPES.BIG_RADIUS){
                    R *= buff.value;
                    // Clear after use
                    if(turn === 'player') playerBuff = null;
                    else botBuff = null;
                }
                const baseDmg = CFG.baseDamage;

                // Map VERTICAL impact speed (px/s) to multiplier ~[1..4]
                // High arc => large downward speed => much higher damage.
                const v = Math.max(0, impactSpeed);
                let mult = 1 + (v / 147); // ~2x at 147px/s (x1.5 more sensitive)
                mult = clamp(mult, 1, 4);

                let totalDmg = baseDmg * mult;
                
                // Apply buff x2.5 damage
                if(buff && buff.type === BUFF_TYPES.DAMAGE_X2_5){
                    totalDmg *= buff.value;
                    // Clear after use
                    if(turn === 'player') playerBuff = null;
                    else botBuff = null;
                }
                
                // DOUBLE_SHOT: 2nd shot deals +50% damage
                if(buff && buff.type === BUFF_TYPES.DOUBLE_SHOT && doubleShotPending){
                    totalDmg *= CFG.buffs.DOUBLE_SHOT_DAMAGE_MULT;
                }

                let maxDmg = 0;
                let totalDealt = 0;
                const targets = [player, bot];
                const shooter = turn === 'player' ? player : bot;
                const hasLifesteal = buff && buff.type === BUFF_TYPES.LIFESTEAL;
                const hasBurn = buff && buff.type === BUFF_TYPES.BURN;
                
                targets.forEach(t => {
                    const d = Math.sqrt(dist2(atx, aty, t.x, t.y));
                    if (d < R) {
                        let dmg = Math.round(totalDmg * (1 - d / R));
                        
                        // ARMOR buff: reduce incoming damage by 30% (persists until end of match)
                        const targetBuff = t === player ? playerBuff : botBuff;
                        if(targetBuff && targetBuff.type === BUFF_TYPES.ARMOR){
                            const reduction = targetBuff.value || 0.3;
                            dmg = Math.round(dmg * (1 - reduction));
                        }
                        
                        t.hp = clamp(t.hp - dmg, 0, 999);
                        dmgTexts.push({ x: t.x, y: t.y - t.r - 18, v: dmg, t: 0, tier: (dmg>100?3:(dmg>=80?2:(dmg>=60?1:0))) });
                        if(dmg > maxDmg) maxDmg = dmg;
                        totalDealt += dmg;
                        
                        // BURN buff: apply burn debuff to hit enemy, clear their buffs
                        if(hasBurn && t !== shooter){
                            if(t === player){
                                playerBurnDebuff = {active: true};
                                playerBuff = null; // Clear all buffs
                                showBuffMessage('🔥 Bạn bị Thiêu đốt!');
                            } else {
                                botBurnDebuff = {active: true};
                                botBuff = null; // Clear all buffs
                                showBuffMessage('🔥 Bot bị Thiêu đốt!');
                            }
                            setLog(`${turn === 'player' ? 'Bot' : 'Bạn'} bị Thiêu đốt! Mất tất cả buff và mỗi lượt -10% HP!`);
                        }
                    }
                });
                
                // Clear BUFF_TYPES.BURN after use
                if(hasBurn){
                    if(turn === 'player') playerBuff = null;
                    else botBuff = null;
                }
                
                // LIFESTEAL: heal shooter immediately after dealing damage (before turn ends)
                if(hasLifesteal && totalDealt > 0){
                    const lsRatio = (CFG && CFG.lifestealRatio) || 1;
                    const healAmount = Math.round(totalDealt * lsRatio);
                    shooter.hp = clamp(shooter.hp + healAmount, 0, shooter.maxHp);
                    // Add heal text effect (green +HP above shooter)
                    healTexts.push({ x: shooter.x, y: shooter.y - shooter.r - 25, v: healAmount, t: 0 });
                    setLog(`${turn === 'player' ? 'Bạn' : 'Bot'} hồi ${healAmount} HP từ hút máu!`);
                    // Clear after use
                    if(turn === 'player') playerBuff = null;
                    else botBuff = null;
                }
                
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
            const healTexts = [];
            let shakeT = 0;
            let shakeAmp = 0;
            
            // Buff system for hitting birds
            let playerBuff = null; // {type, turnsLeft, value}
            let botBuff = null;
            // Track burn debuff separately (can have buff + be burned at same time)
            let playerBurnDebuff = null; // {turns: Infinity, active: true}
            let botBurnDebuff = null;
            
            const BUFF_TYPES = {
                DAMAGE_X2_5: 'dmg2.5',
                DOUBLE_SHOT: 'double',
                EXTRA_TURNS: 'extra',
                BIG_RADIUS: 'big',
                LIFESTEAL: 'lifesteal',
                ARMOR: 'armor',
                BURN: 'burn' // Buff: next shot applies burn debuff to enemy
            };
            
            // Center buff messages
            let buffMessages = [];
            function showBuffMessage(text){
                buffMessages.push({text, t: 0, y: H * 0.4});
            }
            
            // Hit birds fall and fade
            let fallingBirds = [];
            
            function checkProjHitBird(){
                if(!proj || !proj.alive) return false;
                const phoenixScale = (CFG && CFG.phoenixSize) || 1;
                const hitRadius = 20 * phoenixScale;
                for(let i = birds.length - 1; i >= 0; i--){
                    let b = birds[i];
                    const dx = proj.x - b.x;
                    const dy = proj.y - b.y;
                    const dist = Math.sqrt(dx*dx + dy*dy);
                    if(dist < hitRadius){ // Hit radius scales with phoenixSize
                        // Visual explosion at hit point
                        flashes.push({x: proj.x, y: proj.y, t: 0});
                        sfxDopplerHit();
                        // Bird falls
                        fallingBirds.push({
                            x: b.x, y: b.y, vx: proj.vx * 0.3, vy: -50, 
                            color: b.color, wingPhase: b.wingPhase, alpha: 1
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
            
            function pickBuffByChance(){
                const chances = CFG.buffChances || {};
                const entries = Object.keys(BUFF_TYPES).map(k => ({
                    type: BUFF_TYPES[k],
                    key: k,
                    w: chances[k] ?? 0
                })).filter(e => e.w > 0);
                if(entries.length === 0){
                    // fallback uniform
                    const buffs = Object.values(BUFF_TYPES);
                    return buffs[Math.floor(Math.random() * buffs.length)];
                }
                const sum = entries.reduce((a,e)=>a+e.w,0);
                let r = Math.random() * sum;
                for(const e of entries){
                    r -= e.w;
                    if(r <= 0) return e.type;
                }
                return entries[entries.length-1].type;
            }

            function giveBuff(target){
                // Check if target has burn debuff - cannot receive buffs while burned
                if(target === 'player' && botBurnDebuff && botBurnDebuff.active){
                    showBuffMessage('🔥 Bạn bị Thiêu đốt! Không thể nhận buff!');
                    return;
                }
                if(target === 'bot' && playerBurnDebuff && playerBurnDebuff.active){
                    showBuffMessage('🤖 Bot bị Thiêu đốt! Không thể nhận buff!');
                    return;
                }
                
                const buff = pickBuffByChance();
                const buffData = {type: buff, turnsLeft: 1};
                switch(buff){
                    case BUFF_TYPES.DAMAGE_X2_5:
                        buffData.value = CFG.buffs.DAMAGE_X2_5;
                        break;
                    case BUFF_TYPES.DOUBLE_SHOT:
                        buffData.value = 2;
                        break;
                    case BUFF_TYPES.EXTRA_TURNS:
                        buffData.value = CFG.buffs.EXTRA_TURNS;
                        break;
                    case BUFF_TYPES.BIG_RADIUS:
                        buffData.value = CFG.buffs.BIG_RADIUS;
                        break;
                    case BUFF_TYPES.LIFESTEAL:
                        buffData.value = 1;
                        break;
                    case BUFF_TYPES.ARMOR:
                        buffData.value = CFG.buffs.ARMOR_DAMAGE_REDUCTION || 0.3;
                        break;
                    case BUFF_TYPES.BURN:
                        buffData.value = 1; // Next shot applies burn debuff
                        break;
                }
                if(target === 'player'){
                    playerBuff = buffData;
                    const msg = `🎯 Item: ${getBuffName(buff)}`;
                    setLog(msg);
                    showBuffMessage(msg);
                } else {
                    botBuff = buffData;
                    const msg = `🤖 Bot nhận: ${getBuffName(buff)}`;
                    setLog(msg);
                    showBuffMessage(msg);
                }
            }
            
            function getBuffName(buff){
                switch(buff){
                    case BUFF_TYPES.DAMAGE_X2_5: return 'Sát thương x2.5';
                    case BUFF_TYPES.DOUBLE_SHOT: return 'Bắn 2 phát';
                    case BUFF_TYPES.EXTRA_TURNS: return 'Thêm 2 lượt';
                    case BUFF_TYPES.BIG_RADIUS: return 'Đạn to x3';
                    case BUFF_TYPES.LIFESTEAL: return 'Hút máu';
                    case BUFF_TYPES.ARMOR: return 'Hộ giáp';
                    case BUFF_TYPES.BURN: return 'Thiêu đốt';
                }
            }
            
            function updateFallingBirds(){
                for(let i = fallingBirds.length - 1; i >= 0; i--){
                    let b = fallingBirds[i];
                    b.x += b.vx * dt;
                    b.y += b.vy * dt;
                    b.vy += g * dt;
                    b.alpha -= 0.02;
                    b.wingPhase += 0.5;
                    if(b.alpha <= 0 || b.y > H){
                        fallingBirds.splice(i, 1);
                    }
                }
            }
            
            function drawFallingBirds(){
                for(let b of fallingBirds){
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
                    if(checkProjHitBird()){
                        proj = null;
                        // Bird hit handled, continue game loop
                    } else {
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
                            if(maxDmg >= 60){
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
                                    if(maxDmg >= 60){
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

                if(shakeT > 0){
                    shakeT -= dt;
                    if(shakeT < 0) shakeT = 0;
                }

                // Turn countdown update
                if(!turnLock && turnTimerActive && !proj){
                    // decrement once per frame
                    turnTimeLeft -= dt;
                    const sec = Math.max(0, Math.ceil(turnTimeLeft));
                    if(sec !== lastTickSec){
                        const urgent = sec <= 5;
                        sfxTick(urgent);
                        lastTickSec = sec;
                    }
                    if(turnTimeLeft <= 0){
                        // Auto-end turn if time runs out
                        endShot('timeout');
                    }
                }

                draw();
                requestAnimationFrame(step);
            }

            function startTurnTimer(who){
                turnTimeLeft = CFG.turnSeconds;
                lastTickSec = CFG.turnSeconds;
                turnTimerActive = true;
                sfxTurnWhistle();
            }
            function stopTurnTimer(){
                turnTimerActive = false;
            }

            function endShot(reason) {
                if (turnLock) {
                    shootBtn.disabled = true;
                    return;
                }
                
                // BURN DEBUFF: At start of each turn, take burnDamagePercent% max HP damage
                const burnPercent = (CFG && CFG.burnDamagePercent) ? CFG.burnDamagePercent / 100 : 0.1;
                
                if(turn === 'player' && botBurnDebuff && botBurnDebuff.active){
                    const burnDmg = Math.round(bot.maxHp * burnPercent);
                    bot.hp = clamp(bot.hp - burnDmg, 0, 999);
                    dmgTexts.push({ x: bot.x, y: bot.y - bot.r - 18, v: burnDmg, t: 0, tier: 1 });
                    hpB.textContent = bot.hp;
                    setLog(`🔥 Bot bị Thiêu đốt -${burnDmg} HP!`);
                }
                if(turn === 'bot' && playerBurnDebuff && playerBurnDebuff.active){
                    const burnDmg = Math.round(player.maxHp * burnPercent);
                    player.hp = clamp(player.hp - burnDmg, 0, 999);
                    dmgTexts.push({ x: player.x, y: player.y - player.r - 18, v: burnDmg, t: 0, tier: 1 });
                    hpP.textContent = player.hp;
                    setLog(`🔥 Bạn bị Thiêu đốt -${burnDmg} HP!`);
                }
                
                // Check win condition after burn damage
                if (player.hp <= 0 && bot.hp <= 0) {
                    setLog('Cả hai cùng ngã. Hoà. Reset để chơi lại.');
                    turnLock = true;
                    return;
                } else if (player.hp <= 0) {
                    setLog('Bạn thua rồi. Reset để chơi lại.');
                    turnLock = true;
                    return;
                } else if (bot.hp <= 0) {
                    setLog('Bạn thắng! Reset để chơi lại.');
                    turnLock = true;
                    return;
                }
                
                // Check for double shot buff
                const currentBuff = turn === 'player' ? playerBuff : botBuff;
                if(currentBuff && currentBuff.type === BUFF_TYPES.DOUBLE_SHOT && !doubleShotPending && lastShotParams){
                    doubleShotPending = true;
                    // Fire second shot with same params
                    setTimeout(() => {
                        const p = lastShotParams;
                        startShot(p.from, p.angleDeg, p.power, p.dir);
                        if(turn === 'player') setLog('🎯 Bắn phát thứ 2!');
                    }, 300);
                    return;
                }
                
                doubleShotPending = false;
                lastShotParams = null;
                
                // Check for extra turns buff
                if(currentBuff && currentBuff.type === BUFF_TYPES.EXTRA_TURNS && currentBuff.value > 0){
                    currentBuff.value--;
                    if(currentBuff.value >= 0){
                        if(turn === 'player'){
                            setLog(`🎯 Lượt thêm! Còn ${currentBuff.value + 1} lượt.`);
                            player.stamina = player.maxStamina;
                            shootBtn.disabled = false;
                        } else {
                            bot.stamina = bot.maxStamina;
                            setTimeout(botTurn, CFG.turnGapMs);
                        }
                        return;
                    }
                }
                
                // Clear buffs that were used (DOUBLE_SHOT, EXTRA_TURNS)
                // Keep DAMAGE_X2_5 and BIG_RADIUS for next shot
                if(currentBuff){
                    if(currentBuff.type === BUFF_TYPES.DOUBLE_SHOT || 
                       currentBuff.type === BUFF_TYPES.EXTRA_TURNS){
                        if(turn === 'player') playerBuff = null;
                        else botBuff = null;
                    }
                    // DAMAGE_X2_5 and BIG_RADIUS will be cleared after used in explode()
                }

                // adjust wind slightly each turn
                windVal = clamp(windVal + randn() * 2.2, -3.0, 3.0);
                wind.value = Math.round(windVal * 10);
                windV.textContent = windVal.toFixed(1);

                if (turn === 'player') {
                    turn = 'bot';
                    shootBtn.disabled = true;
                    bot.stamina = bot.maxStamina;
                    setLog('Lượt của bot...');
                    startTurnTimer('bot');
                    setTimeout(botTurn, CFG.turnGapMs);
                } else {
                    // end bot turn -> gap -> start player turn
                    shootBtn.disabled = true;
                    setTimeout(() => {
                        turn = 'player';
                        shootBtn.disabled = false;
                        player.stamina = player.maxStamina;
                        setLog('Lượt của bạn. Chỉnh góc/lực rồi bắn.');
                        startTurnTimer('player');
                    }, CFG.turnGapMs);
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
                
                // Check buff for bot
                if(botBuff){
                    const msg = `🤖 Bot dùng: ${getBuffName(botBuff.type)}`;
                    setLog(msg);
                    showBuffMessage(msg);
                }

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
                const x = ent.x, y = ent.y, r = ent.r;
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
                const w = 60, h = 7;
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
                
                // Draw buff icons above HP bar
                const buff = (ent === player) ? playerBuff : botBuff;
                const burnDebuff = (ent === player) ? playerBurnDebuff : botBurnDebuff;
                drawBuffIcons(ent, buff, burnDebuff);
            }

            // Draw buff icons above a character
            function drawBuffIcons(ent, buff, burnDebuff) {
                const icons = [];
                
                // BURN DEBUFF: Show fire icon (highest priority, on the left)
                if (burnDebuff && burnDebuff.active) {
                    icons.push({type: 'burn_debuff', color: '#ff2200'});
                }
                
                // BURN BUFF: Show burning bullet icon
                if (buff && buff.type === BUFF_TYPES.BURN) {
                    icons.push({type: 'burn_buff', color: '#ff4400'});
                }
                
                if (buff && buff.type === BUFF_TYPES.EXTRA_TURNS && buff.value > 0) {
                    icons.push({type: 'extra', color: '#ffdd00'});
                }
                if (buff && buff.type === BUFF_TYPES.DAMAGE_X2_5) {
                    icons.push({type: 'damage', color: '#ff8800'});
                }
                if (buff && buff.type === BUFF_TYPES.BIG_RADIUS) {
                    icons.push({type: 'big', color: '#cccccc'});
                }
                if (buff && buff.type === BUFF_TYPES.LIFESTEAL) {
                    icons.push({type: 'lifesteal', color: '#44ff44'});
                }
                if (buff && buff.type === BUFF_TYPES.ARMOR) {
                    icons.push({type: 'armor', color: '#4488ff'});
                }
                if (buff && buff.type === BUFF_TYPES.DOUBLE_SHOT) {
                    icons.push({type: 'double', color: '#ff8800'});
                }
                
                if (icons.length === 0) return;
                
                const iconSize = 14;
                const spacing = 4;
                const totalWidth = icons.length * iconSize + (icons.length - 1) * spacing;
                let startX = ent.x - totalWidth / 2;
                const startY = ent.y - ent.r - 38;
                const time = Date.now() / 1000;
                
                icons.forEach((icon, idx) => {
                    const x = startX + idx * (iconSize + spacing) + iconSize / 2;
                    const y = startY;
                    ctx.save();
                    ctx.translate(x, y);
                    ctx.shadowBlur = 8;
                    ctx.shadowColor = icon.color;
                    
                    switch(icon.type) {
                        case 'extra': // Lightning bolt - flipped horizontally
                            ctx.save();
                            ctx.scale(-1, 1); // Flip X
                            ctx.fillStyle = icon.color;
                            ctx.beginPath();
                            ctx.moveTo(-2, -6);
                            ctx.lineTo(4, -2);
                            ctx.lineTo(0, 0);
                            ctx.lineTo(4, 6);
                            ctx.lineTo(-4, 0);
                            ctx.lineTo(0, -2);
                            ctx.closePath();
                            ctx.fill();
                            ctx.restore();
                            ctx.shadowBlur = 12 + Math.sin(time * 8) * 4;
                            break;
                        case 'damage': // Bullet orange
                            ctx.fillStyle = icon.color;
                            ctx.beginPath();
                            ctx.ellipse(0, 0, 4, 7, 0, 0, Math.PI * 2);
                            ctx.fill();
                            ctx.strokeStyle = `rgba(255, 136, 0, ${0.5 + Math.sin(time * 6) * 0.3})`;
                            ctx.lineWidth = 2;
                            ctx.beginPath();
                            ctx.arc(0, 0, 6 + Math.sin(time * 4) * 2, 0, Math.PI * 2);
                            ctx.stroke();
                            break;
                        case 'big': // Big bullet with sparkle + circle center
                            const scale = 1 + Math.sin(time * 4) * 0.2;
                            ctx.scale(scale, scale);
                            // Main bullet body (ellipse)
                            ctx.fillStyle = '#ffffff';
                            ctx.beginPath();
                            ctx.ellipse(0, 0, 5, 9, 0, 0, Math.PI * 2);
                            ctx.fill();
                            // Circle center
                            ctx.fillStyle = '#cccccc';
                            ctx.beginPath();
                            ctx.arc(0, 0, 3, 0, Math.PI * 2);
                            ctx.fill();
                            // Sparkle rays
                            ctx.strokeStyle = `rgba(200, 200, 200, ${0.6 + Math.sin(time * 8) * 0.4})`;
                            ctx.lineWidth = 2;
                            for(let i=0; i<4; i++) {
                                const angle = (time * 2 + i * Math.PI / 2);
                                const r1 = 8;
                                const r2 = 12 + Math.sin(time * 6) * 3;
                                ctx.beginPath();
                                ctx.moveTo(Math.cos(angle) * r1, Math.sin(angle) * r1);
                                ctx.lineTo(Math.cos(angle) * r2, Math.sin(angle) * r2);
                                ctx.stroke();
                            }
                            break;
                        case 'lifesteal': // Cross
                            ctx.fillStyle = icon.color;
                            const pulse = 1 + Math.sin(time * 5) * 0.15;
                            ctx.scale(pulse, pulse);
                            ctx.fillRect(-2, -6, 4, 12);
                            ctx.fillRect(-6, -2, 12, 4);
                            ctx.shadowBlur = 10 + Math.sin(time * 6) * 5;
                            ctx.shadowColor = '#44ff44';
                            break;
                        case 'armor': // Shield
                            ctx.fillStyle = icon.color;
                            ctx.beginPath();
                            ctx.moveTo(0, -7);
                            ctx.bezierCurveTo(5, -5, 6, 0, 6, 3);
                            ctx.bezierCurveTo(6, 7, 0, 9, 0, 9);
                            ctx.bezierCurveTo(0, 9, -6, 7, -6, 3);
                            ctx.bezierCurveTo(-6, 0, -5, -5, 0, -7);
                            ctx.closePath();
                            ctx.fill();
                            ctx.fillStyle = `rgba(255, 255, 255, ${0.4 + Math.sin(time * 4) * 0.3})`;
                            ctx.beginPath();
                            ctx.ellipse(-2, -2, 2, 3, -0.3, 0, Math.PI * 2);
                            ctx.fill();
                            break;
                        case 'burn_buff': // Burning bullet (buff)
                            ctx.fillStyle = '#ff4400';
                            ctx.beginPath();
                            ctx.ellipse(0, 0, 4, 7, 0, 0, Math.PI * 2);
                            ctx.fill();
                            // Flame effect
                            ctx.fillStyle = `rgba(255, ${Math.floor(100 + Math.random()*100)}, 0, 0.9)`;
                            for(let i=0; i<5; i++){
                                const angle = -Math.PI/2 + (Math.random()-0.5);
                                const h = 4 + Math.random()*6;
                                ctx.beginPath();
                                ctx.moveTo(Math.cos(angle)*2, Math.sin(angle)*2);
                                ctx.lineTo(Math.cos(angle-0.3)*h, Math.sin(angle-0.3)*h - 3);
                                ctx.lineTo(Math.cos(angle+0.3)*h, Math.sin(angle+0.3)*h - 3);
                                ctx.fill();
                            }
                            ctx.shadowBlur = 15 + Math.sin(time*10)*5;
                            ctx.shadowColor = '#ff2200';
                            break;
                        case 'burn_debuff': // Fire flame (debuff)
                            ctx.shadowBlur = 15;
                            ctx.shadowColor = '#ff2200';
                            // Main flame
                            ctx.fillStyle = `rgba(255, ${Math.floor(80 + Math.sin(time*8)*40)}, 0, 0.95)`;
                            ctx.beginPath();
                            ctx.moveTo(0, 5);
                            ctx.quadraticCurveTo(-4, 0, -3, -5);
                            ctx.quadraticCurveTo(-2, -10, 0, -12);
                            ctx.quadraticCurveTo(2, -10, 3, -5);
                            ctx.quadraticCurveTo(4, 0, 0, 5);
                            ctx.fill();
                            // Inner flame
                            ctx.fillStyle = `rgba(255, 200, 0, ${0.8 + Math.sin(time*12)*0.2})`;
                            ctx.beginPath();
                            ctx.moveTo(0, 3);
                            ctx.quadraticCurveTo(-2, -2, -1, -6);
                            ctx.quadraticCurveTo(0, -8, 1, -6);
                            ctx.quadraticCurveTo(2, -2, 0, 3);
                            ctx.fill();
                            // Flicker effect
                            ctx.fillStyle = `rgba(255, 100, 0, ${0.6 + Math.random()*0.4})`;
                            ctx.beginPath();
                            ctx.arc(0, -8 + Math.sin(time*15)*2, 2, 0, Math.PI*2);
                            ctx.fill();
                            break;
                        case 'double': // Two bullets
                            ctx.fillStyle = icon.color;
                            ctx.beginPath();
                            ctx.ellipse(-3, 0, 2.5, 5, -0.2, 0, Math.PI * 2);
                            ctx.fill();
                            ctx.beginPath();
                            ctx.ellipse(3, -2, 2.5, 5, 0.2, 0, Math.PI * 2);
                            ctx.fill();
                            break;
                    }
                    ctx.restore();
                });
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
                const s = `Gió: ${windVal.toFixed(1)} (m/s)`;
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
                if(player.hp < 50 && player.hp > 0 && !turnLock) startHeartbeat();
                else stopHeartbeat();

                // screen shake
                if(shakeT > 0){
                    const k = shakeT / 0.32;
                    const amp = shakeAmp * k;
                    ctx.save();
                    ctx.translate((Math.random()*2-1)*amp, (Math.random()*2-1)*amp);
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
                    // Check buffs for visual effects
                    const currentBuff = proj.owner === 'player' ? playerBuff : botBuff;
                    let bulletR = proj.r;
                    let bulletColor = 'rgba(255,255,255,.85)';
                    let trailColor = 'rgba(255,255,255,.18)';
                    let hasGlow = false;
                    let glowColor = 'rgba(255,100,0,0.8)';
                    
                    if(currentBuff){
                        if(currentBuff.type === BUFF_TYPES.BIG_RADIUS){
                            bulletR *= 2;
                            bulletColor = 'rgba(220,220,220,.95)'; // Greyish white
                            trailColor = 'rgba(200,200,200,.5)';
                            hasGlow = true;
                            glowColor = 'rgba(255,255,255,0.9)'; // White glow
                        }
                        if(currentBuff.type === BUFF_TYPES.DAMAGE_X2_5 || 
                           (currentBuff.type === BUFF_TYPES.DOUBLE_SHOT && doubleShotPending)){
                            bulletColor = 'rgba(255,140,0,.95)'; // Orange
                            trailColor = 'rgba(255,100,0,.4)';
                            hasGlow = true;
                            glowColor = 'rgba(255,100,0,0.8)';
                        }
                        if(currentBuff.type === BUFF_TYPES.LIFESTEAL){
                            bulletColor = 'rgba(50,255,50,.95)'; // Green
                            trailColor = 'rgba(0,255,0,.4)';
                            hasGlow = true;
                            glowColor = 'rgba(0,255,100,0.8)';
                        }
                        if (currentBuff.type === BUFF_TYPES.ARMOR) {
                            // Armor: bullet stays white (normal), no glow
                            hasGlow = false;
                        }
                        if(currentBuff.type === BUFF_TYPES.BURN){
                            // BURN: Fiery red bullet with intense flame effect
                            bulletColor = 'rgba(255,50,0,.95)'; // Fiery red
                            trailColor = 'rgba(255,80,0,.6)';
                            hasGlow = true;
                            glowColor = 'rgba(255,60,0,1)';
                            bulletR *= 1.5; // Larger bullet
                        }
                    }
                    
                    // Glow effect for buffed bullets
                    if(hasGlow){
                        ctx.shadowBlur = currentBuff && currentBuff.type === BUFF_TYPES.BURN ? 25 : 15;
                        ctx.shadowColor = glowColor;
                    }
                    
                    ctx.fillStyle = bulletColor;
                    ctx.beginPath();
                    ctx.arc(proj.x, proj.y, bulletR, 0, Math.PI * 2);
                    ctx.fill();
                    
                    // BURN: Add flame particles
                    if(currentBuff && currentBuff.type === BUFF_TYPES.BURN){
                        ctx.fillStyle = `rgba(255, ${Math.floor(50 + Math.random()*100)}, 0, ${0.7 + Math.random()*0.3})`;
                        for(let i=0; i<3; i++){
                            const angle = Math.random() * Math.PI * 2;
                            const dist = Math.random() * 8;
                            ctx.beginPath();
                            ctx.arc(proj.x + Math.cos(angle)*dist, proj.y + Math.sin(angle)*dist, 2+Math.random()*3, 0, Math.PI*2);
                            ctx.fill();
                        }
                        // Outer flame aura
                        ctx.strokeStyle = `rgba(255, 100, 0, ${0.3 + Math.random()*0.3})`;
                        ctx.lineWidth = 3;
                        ctx.beginPath();
                        ctx.arc(proj.x, proj.y, bulletR + 4 + Math.random()*4, 0, Math.PI*2);
                        ctx.stroke();
                    }
                    
                    ctx.shadowBlur = 0; // Reset shadow

                    // trail - bigger and brighter for buffed bullets
                    const trailLength = hasGlow ? 0.08 : 0.03;
                    const trailWidth = hasGlow ? 6 : 2;
                    ctx.strokeStyle = trailColor;
                    ctx.lineWidth = trailWidth;
                    ctx.lineCap = 'round';
                    ctx.beginPath();
                    ctx.moveTo(proj.x, proj.y);
                    ctx.lineTo(proj.x - proj.vx * trailLength, proj.y - proj.vy * trailLength);
                    ctx.stroke();
                    
                    // Extra trail segments for buffed bullets
                    if(hasGlow){
                        ctx.strokeStyle = trailColor.replace('0.4', '0.2').replace('0.5', '0.2');
                        ctx.lineWidth = 10;
                        ctx.beginPath();
                        ctx.moveTo(proj.x, proj.y);
                        ctx.lineTo(proj.x - proj.vx * 0.04, proj.y - proj.vy * 0.04);
                        ctx.stroke();
                    }
                    
                    // Sparkle effect for BIG_RADIUS (white/grey)
                    if(currentBuff && currentBuff.type === BUFF_TYPES.BIG_RADIUS){
                        ctx.fillStyle = `rgba(255,255,255,${0.6 + Math.random()*0.4})`;
                        ctx.beginPath();
                        ctx.arc(proj.x + (Math.random()*10-5), proj.y + (Math.random()*10-5), 2, 0, Math.PI*2);
                        ctx.fill();
                    }
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
                    if(d.tier === 3) col = '255,45,45';
                    else if(d.tier === 2) col = '255,160,60';
                    else if(d.tier === 1) col = '255,235,120';
                    ctx.fillStyle = `rgba(${col},${a})`;
                    ctx.strokeStyle = `rgba(0,0,0,${0.35*a})`;
                    ctx.lineWidth = 3;
                    const text = `-${d.v}`;
                    ctx.strokeText(text, d.x, d.y);
                    ctx.fillText(text, d.x, d.y);
                }
                
                // floating heal texts (green +HP)
                for (let i = healTexts.length - 1; i >= 0; i--) {
                    const h = healTexts[i];
                    h.t += dt;
                    const a = 1 - (h.t / 0.9);
                    if (a <= 0) {
                        healTexts.splice(i, 1);
                        continue;
                    }
                    ctx.fillStyle = `rgba(50,255,100,${a})`;
                    ctx.strokeStyle = `rgba(0,0,0,${0.35*a})`;
                    ctx.lineWidth = 3;
                    const text = `+${h.v}`;
                    ctx.strokeText(text, h.x, h.y - h.t * 20);
                    ctx.fillText(text, h.x, h.y - h.t * 20);
                }
                
                ctx.textAlign = 'start';

                // Turn countdown display (left, under turn label)
                if(!turnLock){
                    const sec = Math.max(0, Math.ceil(turnTimeLeft));
                    // Hard colors per second: more red over time, last 5s orange-red
                    let col = '#ffffff';
                    if(sec <= 5) col = '#ff3300';
                    else if(sec <= 7) col = '#ff6666';
                    else if(sec <= 10) col = '#ff9999';
                    else if(sec <= 12) col = '#ffcccc';
                    // Shadow glow
                    ctx.save();
                    ctx.font = 'bold 18px system-ui';
                    ctx.textAlign = 'left';
                    ctx.fillStyle = col;
                    ctx.shadowBlur = 10;
                    ctx.shadowColor = col;
                    ctx.fillText(`⏳ ${sec}`, 16, 44);
                    ctx.restore();
                }

                // Draw buff messages (center, 2s fade)
                for(let i = buffMessages.length - 1; i >= 0; i--){
                    const m = buffMessages[i];
                    m.t += dt;
                    const a = Math.max(0, 1 - m.t / 2);
                    if(a <= 0){
                        buffMessages.splice(i, 1);
                        continue;
                    }
                    ctx.save();
                    ctx.textAlign = 'center';
                    ctx.font = 'bold 24px system-ui';
                    ctx.fillStyle = `rgba(255,200,80,${a})`;
                    ctx.strokeStyle = `rgba(0,0,0,${0.5*a})`;
                    ctx.lineWidth = 4;
                    ctx.strokeText(m.text, W/2, m.y);
                    ctx.fillText(m.text, W/2, m.y);
                    ctx.restore();
                }

                if(shakeT > 0) ctx.restore();

                // HUD turn
                ctx.fillStyle = 'rgba(0,0,0,.28)';
                ctx.strokeStyle = 'rgba(255,255,255,.12)';
                ctx.lineWidth = 1;
                ctx.roundRect(12, 56, 130, 36, 12);
                ctx.fill();
                ctx.stroke();
                ctx.fillStyle = 'rgba(233,238,252,.9)';
                ctx.font = '12px system-ui';
                ctx.fillText(`Lượt: ${turn === 'player' ? 'Bạn' : 'Bot'}`, 24, 78);
            }

            function randomSky(){
                // cohesive red/black sky themes
                const skies = [
                    'linear-gradient(#060607, #14060a 60%, #0b0b0d)',
                    'linear-gradient(#070709, #1a070c 60%, #0b0b0e)',
                    'linear-gradient(#050506, #110407 60%, #09090c)',
                    'linear-gradient(#09090c, #1b050a 58%, #0b0b0d)',
                    'radial-gradient(800px 520px at 25% 20%, rgba(255,45,45,.22), transparent 62%), linear-gradient(#060607, #12060a 60%, #0b0b0d)'
                ];
                document.documentElement.style.setProperty('--sky', skies[(Math.random()*skies.length)|0]);
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
                // Clear all buffs on reset
                playerBuff = null;
                botBuff = null;
                // Clear burn debuffs
                playerBurnDebuff = null;
                botBurnDebuff = null;
                // Reset turn timer
                startTurnTimer('player');
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
                if(a >= 75) setLog('💡 Góc ' + a.toFixed(0) + '° siêu cao! Đạn rơi mạnh = sát thương cực đại!');
                else if(a >= 60) setLog('💡 Góc ' + a.toFixed(0) + '° cao. Sát thương sẽ rất lớn khi đạn rơi!');
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
                btn.addEventListener('touchstart', start, {passive: false});
                btn.addEventListener('touchend', stop);
                btn.addEventListener('touchcancel', stop);
            }
            
            setupHoldBtn(moveLBtn, -MOVE_STEP);
            setupHoldBtn(moveRBtn, MOVE_STEP);

            // Modal handlers
            const buffModal = document.getElementById('buffModal');
            const buffLink = document.getElementById('buffLink');
            const closeBuffModal = document.getElementById('closeBuffModal');
            
            if(buffLink){
                buffLink.addEventListener('click', () => {
                    buffModal.classList.add('active');
                });
            }
            
            if(closeBuffModal){
                closeBuffModal.addEventListener('click', () => {
                    buffModal.classList.remove('active');
                });
            }
            
            if(buffModal){
                buffModal.addEventListener('click', (e) => {
                    if(e.target === buffModal){
                        buffModal.classList.remove('active');
                    }
                });
            }

            // Config Modal and Form
            const configModal = document.getElementById('configModal');
            const closeConfigModal = document.getElementById('closeConfigModal');
            const configForm = document.getElementById('configForm');
            const resetConfigBtn = document.getElementById('resetConfig');
            
            // Show cheat button after 3 seconds (dev mode)
            setTimeout(() => {
                if(cheatBtn) cheatBtn.style.display = 'inline-flex';
            }, 3000);
            
            if(cheatBtn){
                cheatBtn.addEventListener('click', () => {
                    // Load current values into form
                    if(CFG){
                        Object.keys(CFG).forEach(key => {
                            if(typeof CFG[key] === 'object'){
                                Object.keys(CFG[key]).forEach(subKey => {
                                    const input = configForm.querySelector(`[name="${key}.${subKey}"]`);
                                    if(input){
                                        let val = CFG[key][subKey];
                                        if(key === 'buffChances') val = Math.round(val * 100);
                                        if(key === 'buffs' && (subKey === 'ARMOR_DAMAGE_REDUCTION' || subKey === 'LIFESTEAL_RATIO')){
                                            val = subKey === 'ARMOR_DAMAGE_REDUCTION' ? Math.round(val * 100) : Math.round(val * 100);
                                        }
                                        if(subKey === 'BURN_DAMAGE_PERCENT') val = Math.round(val * 100);
                                        input.value = val;
                                    }
                                });
                            } else {
                                const input = configForm.querySelector(`[name="${key}"]`);
                                if(input) input.value = CFG[key];
                            }
                        });
                    }
                    configModal.classList.add('active');
                });
            }
            
            if(closeConfigModal){
                closeConfigModal.addEventListener('click', () => {
                    configModal.classList.remove('active');
                });
            }
            
            if(configModal){
                configModal.addEventListener('click', (e) => {
                    if(e.target === configModal){
                        configModal.classList.remove('active');
                    }
                });
            }
            
            if(configForm){
                configForm.addEventListener('submit', (e) => {
                    e.preventDefault();
                    const formData = new FormData(configForm);
                    const newConfig = {
                        turnSeconds: 15,
                        maxHp: 500,
                        baseDamage: 38,
                        explosionRadius: 42,
                        buffs: {},
                        buffChances: {}
                    };
                    
                    formData.forEach((value, key) => {
                        if(key.includes('.')){
                            const [section, subKey] = key.split('.');
                            if(!newConfig[section]) newConfig[section] = {};
                            let numVal = parseFloat(value);
                            if(section === 'buffChances') numVal = numVal / 100;
                            if(section === 'buffs' && (subKey === 'ARMOR_DAMAGE_REDUCTION' || subKey === 'LIFESTEAL_RATIO' || subKey === 'BURN_DAMAGE_PERCENT')){
                                numVal = numVal / 100;
                            }
                            newConfig[section][subKey] = numVal;
                        } else {
                            newConfig[key] = parseFloat(value);
                        }
                    });
                    
                    // Update CFG
                    CFG = newConfig;
                    applyConfig();
                    configModal.classList.remove('active');
                    setLog('💾 Config đã được cập nhật!');
                });
            }
            
            if(resetConfigBtn){
                resetConfigBtn.addEventListener('click', () => {
                    fetch('/gunny/config/config.json')
                        .then(r => r.json())
                        .then(defaultConfig => {
                            CFG = defaultConfig;
                            applyConfig();
                            configModal.classList.remove('active');
                            setLog('🔄 Config đã reset về mặc định!');
                        })
                        .catch(() => setLog('❌ Không thể load config mặc định'));
                });
            }

            // init
            resetAll();
            step();
        });
