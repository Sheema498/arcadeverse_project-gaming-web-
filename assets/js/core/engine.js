/* ==========================================================================
   ArcadeVerse 2D ECS Game Engine - Math, Camera, Input, Particles, and ECS Core
   ========================================================================== */

// --- 1. Mathematics Library ---
class Vector2 {
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }

    set(x, y) {
        this.x = x;
        this.y = y;
        return this;
    }

    add(v) {
        this.x += v.x;
        this.y += v.y;
        return this;
    }

    sub(v) {
        this.x -= v.x;
        this.y -= v.y;
        return this;
    }

    mult(n) {
        this.x *= n;
        this.y *= n;
        return this;
    }

    div(n) {
        if (n !== 0) {
            this.x /= n;
            this.y /= n;
        }
        return this;
    }

    mag() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }

    dist(v) {
        const dx = this.x - v.x;
        const dy = this.y - v.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    dot(v) {
        return this.x * v.x + this.y * v.y;
    }

    normalize() {
        const m = this.mag();
        if (m !== 0) this.div(m);
        return this;
    }

    limit(max) {
        if (this.mag() > max) {
            this.normalize();
            this.mult(max);
        }
        return this;
    }

    copy() {
        return new Vector2(this.x, this.y);
    }
}

// --- 2. Input Manager ---
class InputManager {
    constructor() {
        this.keys = {};
        this.mouse = new Vector2(0, 0);
        this.mouseClicked = false;
        this.gamepads = {};
        this.initListeners();
    }

    initListeners() {
        window.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
            this.keys[e.code.toLowerCase()] = true;
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
            this.keys[e.code.toLowerCase()] = false;
        });

        window.addEventListener('mousemove', (e) => {
            // Updated dynamically relative to canvas offset in main loop
            this.mouse.set(e.clientX, e.clientY);
        });

        window.addEventListener('mousedown', () => {
            this.mouseClicked = true;
        });

        window.addEventListener('mouseup', () => {
            this.mouseClicked = false;
        });

        window.addEventListener('gamepadconnected', (e) => {
            this.gamepads[e.gamepad.index] = e.gamepad;
        });

        window.addEventListener('gamepaddisconnected', (e) => {
            delete this.gamepads[e.gamepad.index];
        });
    }

    isPressed(key) {
        return !!this.keys[key.toLowerCase()];
    }

    updateGamepadState() {
        const activePads = navigator.getGamepads ? navigator.getGamepads() : [];
        for (let i = 0; i < activePads.length; i++) {
            if (activePads[i]) {
                this.gamepads[activePads[i].index] = activePads[i];
            }
        }
    }

    getGamepadAxes(padIndex = 0) {
        this.updateGamepadState();
        const pad = this.gamepads[padIndex];
        if (pad && pad.axes) {
            return {
                x: pad.axes[0],
                y: pad.axes[1]
            };
        }
        return { x: 0, y: 0 };
    }

    isGamepadButtonPressed(buttonIndex, padIndex = 0) {
        this.updateGamepadState();
        const pad = this.gamepads[padIndex];
        if (pad && pad.buttons && pad.buttons[buttonIndex]) {
            return pad.buttons[buttonIndex].pressed;
        }
        return false;
    }
}

// --- 3. Camera System ---
class Camera2D {
    constructor(x = 0, y = 0, width = 800, height = 600) {
        this.position = new Vector2(x, y);
        this.target = null;
        this.viewportWidth = width;
        this.viewportHeight = height;
        this.bounds = null; // { minX, minY, maxX, maxY }
        this.lerpSpeed = 0.1;
        this.shakeTime = 0;
        this.shakeIntensity = 0;
        this.shakeOffset = new Vector2(0, 0);
        this.zoom = 1.0;
    }

    setTarget(entityTransform) {
        this.target = entityTransform;
    }

    setBounds(minX, minY, maxX, maxY) {
        this.bounds = { minX, minY, maxX, maxY };
    }

    shake(intensity, durationFrames) {
        this.shakeIntensity = intensity;
        this.shakeTime = durationFrames;
    }

    update() {
        // Track target entity
        if (this.target) {
            const destX = this.target.position.x - this.viewportWidth / (2 * this.zoom);
            const destY = this.target.position.y - this.viewportHeight / (2 * this.zoom);
            
            this.position.x += (destX - this.position.x) * this.lerpSpeed;
            this.position.y += (destY - this.position.y) * this.lerpSpeed;
        }

        // Apply bounds constraints
        if (this.bounds) {
            const limitMaxX = this.bounds.maxX - this.viewportWidth / this.zoom;
            const limitMaxY = this.bounds.maxY - this.viewportHeight / this.zoom;

            this.position.x = Math.max(this.bounds.minX, Math.min(this.position.x, limitMaxX));
            this.position.y = Math.max(this.bounds.minY, Math.min(this.position.y, limitMaxY));
        }

        // Handle camera shake
        if (this.shakeTime > 0) {
            this.shakeOffset.set(
                (Math.random() * 2 - 1) * this.shakeIntensity,
                (Math.random() * 2 - 1) * this.shakeIntensity
            );
            this.shakeTime--;
        } else {
            this.shakeOffset.set(0, 0);
        }
    }

    applyViewport(ctx) {
        ctx.save();
        ctx.scale(this.zoom, this.zoom);
        ctx.translate(
            -Math.floor(this.position.x + this.shakeOffset.x),
            -Math.floor(this.position.y + this.shakeOffset.y)
        );
    }

    restoreViewport(ctx) {
        ctx.restore();
    }
}

// --- 4. Procedural Particle System ---
class Particle {
    constructor() {
        this.position = new Vector2(0, 0);
        this.velocity = new Vector2(0, 0);
        this.acceleration = new Vector2(0, 0);
        this.color = '#fff';
        this.size = 5;
        this.growth = 0;
        this.life = 0; // standard life duration in frames
        this.maxLife = 0;
        this.gravity = 0.0;
        this.decay = 0.98;
    }

    update() {
        this.velocity.add(this.acceleration);
        this.velocity.y += this.gravity;
        this.velocity.mult(this.decay);
        this.position.add(this.velocity);
        this.size = Math.max(0.1, this.size + this.growth);
        this.life--;
    }

    render(ctx) {
        const ratio = this.life / this.maxLife;
        ctx.save();
        ctx.globalAlpha = ratio;
        ctx.fillStyle = this.color;
        ctx.shadowBlur = this.size;
        ctx.shadowColor = this.color;
        
        ctx.beginPath();
        ctx.arc(this.position.x, this.position.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

class ParticleSystem {
    constructor() {
        this.particles = [];
        this.pool = [];
    }

    spawn(x, y, color, size, life, velX, velY, grav = 0.05, decay = 0.98, growth = -0.05) {
        let p;
        if (this.pool.length > 0) {
            p = this.pool.pop();
        } else {
            p = new Particle();
        }

        p.position.set(x, y);
        p.velocity.set(velX, velY);
        p.acceleration.set(0, 0);
        p.color = color;
        p.size = size;
        p.life = life;
        p.maxLife = life;
        p.gravity = grav;
        p.decay = decay;
        p.growth = growth;

        this.particles.push(p);
    }

    spawnExplosion(x, y, color, count = 15, baseSize = 4, baseLife = 40) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 4 + 1;
            this.spawn(
                x, y,
                color,
                Math.random() * baseSize + baseSize / 2,
                Math.floor(Math.random() * baseLife) + baseLife / 2,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed
            );
        }
    }

    update() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.update();
            if (p.life <= 0) {
                this.particles.splice(i, 1);
                this.pool.push(p);
            }
        }
    }

    render(ctx) {
        this.particles.forEach(p => p.render(ctx));
    }
}

// --- 5. ECS Core Architecture ---
class Component {
    constructor() {
        this.owner = null;
    }
}

class TransformComponent extends Component {
    constructor(x = 0, y = 0, width = 32, height = 32) {
        super();
        this.position = new Vector2(x, y);
        this.width = width;
        this.height = height;
        this.rotation = 0; // rotation angle in radians
    }
}

class PhysicsBodyComponent extends Component {
    constructor() {
        super();
        this.velocity = new Vector2(0, 0);
        this.acceleration = new Vector2(0, 0);
        this.maxVelocity = new Vector2(10, 10);
        this.gravity = 0.5;
        this.friction = new Vector2(0.9, 0.9);
        this.isGrounded = false;
        this.onSlope = false;
    }
}

class SpriteComponent extends Component {
    constructor(color = '#fff', proceduralDrawFunc = null) {
        super();
        this.color = color;
        // Allows customizing procedural graphics
        this.draw = proceduralDrawFunc || ((ctx, transform) => {
            ctx.fillStyle = this.color;
            ctx.fillRect(0, 0, transform.width, transform.height);
        });
    }
}

class ColliderComponent extends Component {
    constructor(isTrigger = false, offset = new Vector2(0, 0)) {
        super();
        this.isTrigger = isTrigger;
        this.offset = offset;
        this.solid = true;
    }

    getBounds(transform) {
        return {
            minX: transform.position.x + this.offset.x,
            minY: transform.position.y + this.offset.y,
            maxX: transform.position.x + this.offset.x + transform.width,
            maxY: transform.position.y + this.offset.y + transform.height
        };
    }
}

class ScriptComponent extends Component {
    constructor(behaviors = {}) {
        super();
        this.update = behaviors.update || (() => {});
        this.init = behaviors.init || (() => {});
        this.onTriggerEnter = behaviors.onTriggerEnter || (() => {});
        this.onCollision = behaviors.onCollision || (() => {});
    }
}

class Entity {
    constructor(id) {
        this.id = id;
        this.components = {};
        this.active = true;
    }

    addComponent(component) {
        const typeName = component.constructor.name;
        component.owner = this;
        this.components[typeName] = component;
        return this;
    }

    getComponent(componentClass) {
        return this.components[componentClass.name] || null;
    }

    hasComponent(componentClass) {
        return !!this.components[componentClass.name];
    }
}

class ECS_Engine {
    constructor() {
        this.entities = [];
        this.entityCounter = 0;
        this.systems = [];
        this.particleSystem = new ParticleSystem();
    }

    createEntity() {
        const e = new Entity(this.entityCounter++);
        this.entities.push(e);
        return e;
    }

    addSystem(systemFunc) {
        this.systems.push(systemFunc);
    }

    update(dt) {
        // Run behavioral script updates
        this.entities.forEach(e => {
            if (e.active && e.hasComponent(ScriptComponent)) {
                e.getComponent(ScriptComponent).update(e, dt);
            }
        });

        // Run systems
        this.systems.forEach(sys => sys(this, dt));

        // Update particles
        this.particleSystem.update();

        // Clear inactive entities
        this.entities = this.entities.filter(e => e.active);
    }

    render(ctx) {
        // In-game systems draw components
        this.particleSystem.render(ctx);
    }
}

// Built-in physics system solver
function physicsSystem(engine, dt) {
    engine.entities.forEach(e => {
        if (!e.active) return;
        const transform = e.getComponent(TransformComponent);
        const body = e.getComponent(PhysicsBodyComponent);
        
        if (transform && body) {
            body.velocity.add(body.acceleration);
            
            // Limit speed
            body.velocity.x = Math.max(-body.maxVelocity.x, Math.min(body.velocity.x, body.maxVelocity.x));
            body.velocity.y = Math.max(-body.maxVelocity.y, Math.min(body.velocity.y, body.maxVelocity.y));
            
            // Apply friction
            body.velocity.x *= body.friction.x;
            body.velocity.y *= body.friction.y;

            // Apply movement
            transform.position.x += body.velocity.x;
            transform.position.y += body.velocity.y;
            
            // Reset frame acceleration
            body.acceleration.set(0, 0);
        }
    });
}
