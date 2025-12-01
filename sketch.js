let sections = [];
let masterGain, amplitude;

function preload() {
  // Example: load audio files
  this.jazzLoop = loadSound('assets/audio/jazz_loop.mp3');
  this.rockLoop = loadSound('assets/audio/rock_loop.mp3');
  this.edmLoop  = loadSound('assets/audio/edm_loop.mp3');
}

function setup() {
  createCanvas(960, 540);
  masterGain = new p5.Gain();
  masterGain.amp(0.9);
  amplitude = new p5.Amplitude();

  // Instantiate sections
  sections.push(new InstrumentSection({
    id: 'jazz1', name: 'Sax Corner', genre: 'Jazz',
    x: 60, y: 80, w: 260, h: 160,
    baseColor: '#2b3a67', activeColor: '#3f64a0',
    buffer: this.jazzLoop
  }));
  sections.push(new InstrumentSection({
    id: 'rock1', name: 'Amp Row', genre: 'Rock',
    x: 360, y: 80, w: 260, h: 160,
    baseColor: '#4b2e2e', activeColor: '#7a3f3f',
    buffer: this.rockLoop
  }));
  sections.push(new InstrumentSection({
    id: 'edm1', name: 'Synth Table', genre: 'EDM',
    x: 660, y: 80, w: 260, h: 160,
    baseColor: '#1c3b2a', activeColor: '#2e7a59',
    buffer: this.edmLoop
  }));
}

function draw() {
  background(18);
  // Ambient lights
  drawAmbient();

  // Sections
  for (const s of sections) {
    s.update();
    s.draw();
  }

  // UI labels
  drawUI();
}

function mousePressed() {
  for (const s of sections) {
    if (s.contains(mouseX, mouseY)) {
      s.toggle();
      break;
    }
  }
}

function keyPressed() {
  if (key === ' ') { // Space: global pause/play (basic example)
    const anyPlaying = sections.some(s => s.isActive);
    if (anyPlaying) sections.forEach(s => s.stop());
    else sections.forEach(s => s.start());
  } else if (key === 'R') {
    sections.forEach(s => s.stop());
  } else if (key === 'M') {
    // Mute master (example)
    masterGain.amp(0.0, 0.3);
  }
}

function drawAmbient() {
  noStroke();
  for (let i = 0; i < 6; i++) {
    const x = (i + 0.5) * (width / 6);
    const y = height * 0.85;
    fill(40 + i * 5, 40, 60, 30);
    ellipse(x, y, 180 + sin(frameCount * 0.01 + i) * 20, 60);
  }
}

function drawUI() {
  fill(220);
  textSize(12);
  text('Click sections to toggle loops. Space: play/pause • R: reset • M: mute', 20, height - 24);
}


class InstrumentSection {
  constructor(cfg, audioCtx) {
    this.id = cfg.id;
    this.name = cfg.name;
    this.genre = cfg.genre;
    this.pos = createVector(cfg.x, cfg.y);
    this.size = createVector(cfg.w, cfg.h);
    this.color = color(cfg.baseColor);
    this.activeColor = color(cfg.activeColor);
    this.isActive = false;

    // Audio
    this.buffer = cfg.buffer;            // loaded in preload
    this.loop = new p5.SoundFile();      // or use p5.SoundFile directly if preloaded
    this.gainNode = new p5.Gain();
    this.gainNode.amp(0);                // start silent
    this.fft = new p5.FFT(0.8, 32);
    this.amp = new p5.Amplitude();

    // Visual
    this.pulse = 0;
    this.equalizer = new Array(16).fill(0);
  }

  contains(mx, my) {
    return mx > this.pos.x && mx < this.pos.x + this.size.x &&
           my > this.pos.y && my < this.pos.y + this.size.y;
  }

  toggle() {
    if (this.isActive) {
      this.stop();
    } else {
      this.start();
    }
  }

  start() {
    if (!this.isActive) {
      this.isActive = true;
      this.loop = this.buffer;       // if using preloaded p5.SoundFile
      if (!this.loop.isPlaying()) this.loop.loop();
      this.gainNode.amp(1.0, 0.4);   // smooth ramp up
      this.amp.setInput(this.loop);
      this.fft.setInput(this.loop);
    }
  }

  stop() {
    if (this.isActive) {
      this.isActive = false;
      this.gainNode.amp(0.0, 0.4, () => this.loop.stop());
    }
  }

  update() {
    // Audio-driven visual values
    const level = this.amp.getLevel();
    this.pulse = lerp(this.pulse, level, 0.2);
    const spectrum = this.fft.analyze();
    for (let i = 0; i < this.equalizer.length; i++) {
      this.equalizer[i] = spectrum[i] / 255.0;
    }
  }

  draw() {
    push();
    translate(this.pos.x, this.pos.y);

    // Background panel
    const bg = this.isActive ? this.activeColor : this.color;
    const brightnessBoost = this.pulse * 80;
    fill(red(bg), green(bg), blue(bg) + brightnessBoost);
    rect(0, 0, this.size.x, this.size.y, 12);

    // Title
    noStroke();
    fill(255);
    textSize(14);
    textAlign(LEFT, TOP);
    text(`${this.name} — ${this.genre}`, 10, 8);

    // Equalizer bars
    const barW = (this.size.x - 20) / this.equalizer.length;
    for (let i = 0; i < this.equalizer.length; i++) {
      const h = map(this.equalizer[i], 0, 1, 4, this.size.y * 0.5);
      const x = 10 + i * barW;
      fill(255, 240, 180);
      rect(x, this.size.y - 14 - h, barW - 2, h, 4);
    }

    // Active glow
    if (this.isActive) {
      stroke(255, 220, 120, 160);
      strokeWeight(3);
      noFill();
      rect(0, 0, this.size.x, this.size.y, 12);
    }

    pop();
  }
}

