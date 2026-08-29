const fs = require('fs');
const path = require('path');

// Read and evaluate engine.js content in jsdom global scope
const engineCode = fs.readFileSync(path.resolve(__dirname, '../assets/js/core/engine.js'), 'utf8');
eval(engineCode + "\n\nglobal.Vector2 = Vector2;\nglobal.ECS_Engine = ECS_Engine;\nglobal.TransformComponent = TransformComponent;\nglobal.PhysicsBodyComponent = PhysicsBodyComponent;\nglobal.SpriteComponent = SpriteComponent;\nglobal.ColliderComponent = ColliderComponent;\nglobal.ScriptComponent = ScriptComponent;\nglobal.Entity = Entity;");

describe('Vector2 Mathematics Library', () => {
    test('should initialize with default parameters (0, 0)', () => {
        const v = new Vector2();
        expect(v.x).toBe(0);
        expect(v.y).toBe(0);
    });

    test('should initialize with custom parameters (5, -3)', () => {
        const v = new Vector2(5, -3);
        expect(v.x).toBe(5);
        expect(v.y).toBe(-3);
    });

    test('should add another vector correctly', () => {
        const v1 = new Vector2(2, 4);
        const v2 = new Vector2(1, -2);
        v1.add(v2);
        expect(v1.x).toBe(3);
        expect(v1.y).toBe(2);
    });

    test('should subtract another vector correctly', () => {
        const v1 = new Vector2(5, 7);
        const v2 = new Vector2(2, 3);
        v1.sub(v2);
        expect(v1.x).toBe(3);
        expect(v1.y).toBe(4);
    });

    test('should multiply by a scalar correctly', () => {
        const v = new Vector2(3, -1);
        v.mult(3);
        expect(v.x).toBe(9);
        expect(v.y).toBe(-3);
    });

    test('should divide by a scalar correctly', () => {
        const v = new Vector2(8, -4);
        v.div(2);
        expect(v.x).toBe(4);
        expect(v.y).toBe(-2);
    });

    test('should calculate magnitude correctly', () => {
        const v = new Vector2(3, 4);
        expect(v.mag()).toBe(5);
    });

    test('should calculate distance to another vector correctly', () => {
        const v1 = new Vector2(1, 1);
        const v2 = new Vector2(4, 5);
        expect(v1.dist(v2)).toBe(5);
    });

    test('should linearly interpolate towards another vector correctly', () => {
        const v1 = new Vector2(0, 0);
        const v2 = new Vector2(10, 20);
        v1.lerp(v2, 0.5);
        expect(v1.x).toBe(5);
        expect(v1.y).toBe(10);
    });

    test('should check equality correctly', () => {
        const v1 = new Vector2(3.000001, 4);
        const v2 = new Vector2(3, 4);
        expect(v1.equals(v2)).toBe(true);
        expect(v1.equals(v2, 1e-7)).toBe(false);
    });

    test('should calculate heading angle correctly', () => {
        const v = new Vector2(0, 10);
        expect(v.heading()).toBeCloseTo(Math.PI / 2);
    });
});

describe('ECS Entity and Components', () => {
    test('should create entity with correct ID', () => {
        const engine = new ECS_Engine();
        const entity = engine.createEntity();
        expect(entity.id).toBe(0);
        expect(entity.active).toBe(true);
    });

    test('should add and retrieve components', () => {
        const engine = new ECS_Engine();
        const entity = engine.createEntity();
        const transform = new TransformComponent(10, 20, 32, 64);
        entity.addComponent(transform);

        expect(entity.hasComponent(TransformComponent)).toBe(true);
        expect(entity.getComponent(TransformComponent).position.x).toBe(10);
        expect(entity.getComponent(TransformComponent).position.y).toBe(20);
        expect(entity.getComponent(TransformComponent).width).toBe(32);
        expect(entity.getComponent(TransformComponent).height).toBe(64);
    });
});
