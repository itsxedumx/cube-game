/**
 * 魔方3D渲染器
 * 负责渲染魔方的3D视觉效果和动画
 */
class CubeRenderer {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.cubeGroup = null;
        this.geometry = null;
        
        this.isAnimating = false;
        this.animationQueue = [];
        
        // 摄像机控制
        this.cameraDistance = 8;
        this.cameraAngleX = 0.3;
        this.cameraAngleY = 0.5;
        
        // 鼠标控制状态
        this.mouseState = {
            isDown: false,
            lastX: 0,
            lastY: 0
        };
        
        this.init();
        this.setupEventListeners();
    }
    
    /**
     * 初始化3D场景
     */
    init() {
        // 创建场景
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0xf0f0f0);
        
        // 创建相机
        const aspect = this.canvas.clientWidth / this.canvas.clientHeight;
        this.camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000);
        this.updateCameraPosition();
        
        // 创建渲染器
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true,
            alpha: true
        });
        this.renderer.setSize(this.canvas.clientWidth, this.canvas.clientHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = false;
        
        // 创建几何体管理器
        this.geometry = new CubeGeometry();
        
        // 创建魔方
        this.createCube();
        
        // 添加光照
        this.setupLighting();
        
        // 开始渲染循环
        this.animate();
    }
    
    /**
     * 创建魔方
     */
    createCube() {
        if (this.cubeGroup) {
            this.scene.remove(this.cubeGroup);
        }
        
        this.cubeGroup = this.geometry.createFullCube();
        this.scene.add(this.cubeGroup);
        
        // 小方块不需要阴影
    }
    
    /**
     * 设置光照
     */
    setupLighting() {
        // 环境光
        const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
        this.scene.add(ambientLight);
        
        // 主方向光
        const directionalLight1 = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight1.position.set(5, 10, 5);
        this.scene.add(directionalLight1);
        
        // 辅助方向光
        const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.4);
        directionalLight2.position.set(-5, -5, 5);
        this.scene.add(directionalLight2);
        
        // 点光源增强立体感
        const pointLight = new THREE.PointLight(0xffffff, 0.3, 50);
        pointLight.position.set(0, 0, 10);
        this.scene.add(pointLight);
    }
    
    /**
     * 更新相机位置
     */
    updateCameraPosition() {
        const x = this.cameraDistance * Math.sin(this.cameraAngleY) * Math.cos(this.cameraAngleX);
        const y = this.cameraDistance * Math.sin(this.cameraAngleX);
        const z = this.cameraDistance * Math.cos(this.cameraAngleY) * Math.cos(this.cameraAngleX);
        
        this.camera.position.set(x, y, z);
        this.camera.lookAt(0, 0, 0);
    }
    
    /**
     * 设置事件监听器
     */
    setupEventListeners() {
        // 鼠标控制
        this.canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.onMouseUp(e));
        this.canvas.addEventListener('wheel', (e) => this.onWheel(e));
        
        // 触摸控制
        this.canvas.addEventListener('touchstart', (e) => this.onTouchStart(e));
        this.canvas.addEventListener('touchmove', (e) => this.onTouchMove(e));
        this.canvas.addEventListener('touchend', (e) => this.onTouchEnd(e));
        
        // 窗口大小改变
        window.addEventListener('resize', () => this.onResize());
        
        // 防止右键菜单
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    }
    
    /**
     * 鼠标按下事件
     */
    onMouseDown(event) {
        this.mouseState.isDown = true;
        this.mouseState.lastX = event.clientX;
        this.mouseState.lastY = event.clientY;
        this.canvas.style.cursor = 'grabbing';
    }
    
    /**
     * 鼠标移动事件
     */
    onMouseMove(event) {
        if (!this.mouseState.isDown) return;
        
        const deltaX = event.clientX - this.mouseState.lastX;
        const deltaY = event.clientY - this.mouseState.lastY;
        
        // 旋转相机角度
        this.cameraAngleY += deltaX * 0.01;
        this.cameraAngleX += deltaY * 0.01;
        
        // 限制垂直旋转角度
        this.cameraAngleX = Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, this.cameraAngleX));
        
        this.updateCameraPosition();
        
        this.mouseState.lastX = event.clientX;
        this.mouseState.lastY = event.clientY;
    }
    
    /**
     * 鼠标抬起事件
     */
    onMouseUp(event) {
        this.mouseState.isDown = false;
        this.canvas.style.cursor = 'grab';
    }
    
    /**
     * 鼠标滚轮事件
     */
    onWheel(event) {
        event.preventDefault();
        
        this.cameraDistance += event.deltaY * 0.01;
        this.cameraDistance = Math.max(4, Math.min(15, this.cameraDistance));
        
        this.updateCameraPosition();
    }
    
    /**
     * 触摸开始事件
     */
    onTouchStart(event) {
        if (event.touches.length === 1) {
            const touch = event.touches[0];
            this.mouseState.isDown = true;
            this.mouseState.lastX = touch.clientX;
            this.mouseState.lastY = touch.clientY;
        }
    }
    
    /**
     * 触摸移动事件
     */
    onTouchMove(event) {
        event.preventDefault();
        
        if (event.touches.length === 1 && this.mouseState.isDown) {
            const touch = event.touches[0];
            const deltaX = touch.clientX - this.mouseState.lastX;
            const deltaY = touch.clientY - this.mouseState.lastY;
            
            this.cameraAngleY += deltaX * 0.01;
            this.cameraAngleX += deltaY * 0.01;
            
            this.cameraAngleX = Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, this.cameraAngleX));
            
            this.updateCameraPosition();
            
            this.mouseState.lastX = touch.clientX;
            this.mouseState.lastY = touch.clientY;
        }
    }
    
    /**
     * 触摸结束事件
     */
    onTouchEnd(event) {
        this.mouseState.isDown = false;
    }
    
    /**
     * 窗口大小改变事件
     */
    onResize() {
        const width = this.canvas.clientWidth;
        const height = this.canvas.clientHeight;
        
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        
        this.renderer.setSize(width, height);
    }
    
    /**
     * 执行层旋转动画
     * @param {string} layer - 层名称 (R, L, U, D, F, B)
     * @param {boolean} clockwise - 是否顺时针
     * @param {number} duration - 动画时长（毫秒）
     */
    animateLayerRotation(layer, clockwise = true, duration = 200) {
        if (this.isAnimating) {
            // 如果正在动画，加入队列
            this.animationQueue.push({ layer, clockwise, duration });
            return;
        }
        
        this.isAnimating = true;
        
        const layerCubies = this.geometry.getLayerCubies(this.cubeGroup, layer);
        const rotationParams = this.geometry.getRotationParams(layer, clockwise);
        
        // 创建临时群组用于旋转
        const rotationGroup = new THREE.Group();
        this.scene.add(rotationGroup);
        
        // 将层中的小方块移到旋转群组中
        layerCubies.forEach(cubie => {
            // 保存世界坐标
            const worldPosition = new THREE.Vector3();
            cubie.getWorldPosition(worldPosition);
            
            // 从原群组移除并添加到旋转群组
            this.cubeGroup.remove(cubie);
            rotationGroup.add(cubie);
            
            // 调整位置以适应新的父群组
            cubie.position.copy(worldPosition);
        });
        
        // 执行旋转动画
        const startTime = Date.now();
        const targetRotation = rotationParams.angle;
        
        const animateRotation = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // 使用缓动函数
            const easeProgress = this.easeOutCubic(progress);
            const currentRotation = targetRotation * easeProgress;
            
            // 设置旋转
            const quaternion = new THREE.Quaternion();
            quaternion.setFromAxisAngle(rotationParams.axis, currentRotation);
            rotationGroup.setRotationFromQuaternion(quaternion);
            
            if (progress < 1) {
                requestAnimationFrame(animateRotation);
            } else {
                // 动画完成，将小方块移回主群组
                layerCubies.forEach(cubie => {
                    const worldPosition = new THREE.Vector3();
                    const worldQuaternion = new THREE.Quaternion();
                    
                    cubie.getWorldPosition(worldPosition);
                    cubie.getWorldQuaternion(worldQuaternion);
                    
                    rotationGroup.remove(cubie);
                    this.cubeGroup.add(cubie);
                    
                    cubie.position.copy(worldPosition);
                    cubie.quaternion.copy(worldQuaternion);
                    
                    // 更新小方块的逻辑位置
                    this.updateCubieLogicalPosition(cubie, layer, clockwise);
                });
                
                this.scene.remove(rotationGroup);
                this.isAnimating = false;
                
                // 处理队列中的下一个动画
                if (this.animationQueue.length > 0) {
                    const nextAnimation = this.animationQueue.shift();
                    this.animateLayerRotation(nextAnimation.layer, nextAnimation.clockwise, nextAnimation.duration);
                }
            }
        };
        
        requestAnimationFrame(animateRotation);
    }
    
    /**
     * 缓动函数
     */
    easeOutCubic(t) {
        return 1 - Math.pow(1 - t, 3);
    }
    
    /**
     * 更新小方块的逻辑位置
     * @param {THREE.Mesh} cubie - 小方块对象
     * @param {string} layer - 旋转的层
     * @param {boolean} clockwise - 是否顺时针
     */
    updateCubieLogicalPosition(cubie, layer, clockwise) {
        const pos = cubie.userData.currentPosition;
        let { x, y, z } = pos;
        
        // 根据旋转层和方向更新逻辑坐标
        switch (layer) {
            case 'R':
            case 'L':
                // 绕X轴旋转，y和z坐标会变化
                if (clockwise === (layer === 'R')) {
                    [y, z] = [z, -y];
                } else {
                    [y, z] = [-z, y];
                }
                break;
            case 'U':
            case 'D':
                // 绕Y轴旋转，x和z坐标会变化
                if (clockwise === (layer === 'U')) {
                    [x, z] = [-z, x];
                } else {
                    [x, z] = [z, -x];
                }
                break;
            case 'F':
            case 'B':
                // 绕Z轴旋转，x和y坐标会变化
                if (clockwise === (layer === 'F')) {
                    [x, y] = [y, -x];
                } else {
                    [x, y] = [-y, x];
                }
                break;
        }
        
        cubie.userData.currentPosition = { x, y, z };
    }
    
    /**
     * 重置魔方到初始状态
     */
    resetCube() {
        this.createCube();
    }
    
    /**
     * 渲染循环
     */
    animate() {
        requestAnimationFrame(() => this.animate());
        this.renderer.render(this.scene, this.camera);
    }
    
    /**
     * 获取当前是否正在动画
     */
    getIsAnimating() {
        return this.isAnimating;
    }
    
    /**
     * 清空动画队列
     */
    clearAnimationQueue() {
        this.animationQueue = [];
    }
}

// 导出到全局
window.CubeRenderer = CubeRenderer;