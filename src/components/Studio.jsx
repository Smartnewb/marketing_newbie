import React, { useState, useRef, Component, useEffect } from 'react';
import {
    Type, Square, Circle, Layers, Layout, Droplet, BoxSelect,
    AlignLeft, AlignCenter, AlignRight, MousePointer2, Maximize,
    ArrowUp, ArrowDown, ChevronsUp, ChevronsDown, Trash2, Download, Bold,
    Eye, EyeOff, Plus, X, Sparkles, Image
} from 'lucide-react';

// Error Boundary to catch and display render errors
class StudioErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('Studio Error Boundary caught an error:', error, errorInfo);
        this.setState({ errorInfo });
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{ padding: '40px', textAlign: 'center', backgroundColor: '#FEF2F2', minHeight: '100vh' }}>
                    <h2 style={{ color: '#991B1B', marginBottom: '16px' }}>스튜디오 오류 발생</h2>
                    <p style={{ color: '#B91C1C', marginBottom: '16px' }}>
                        {this.state.error && this.state.error.toString()}
                    </p>
                    <pre style={{ textAlign: 'left', backgroundColor: '#FEE2E2', padding: '16px', borderRadius: '8px', overflow: 'auto', fontSize: '12px', color: '#7F1D1D' }}>
                        {this.state.errorInfo && this.state.errorInfo.componentStack}
                    </pre>
                    <button
                        onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })}
                        style={{ marginTop: '16px', padding: '12px 24px', backgroundColor: '#3B82F6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
                    >
                        다시 시도
                    </button>
                </div>
            );
        }
        return this.props.children;
    }
}

const FONT_OPTIONS = [
    { name: '기본', value: 'sans-serif' },
    { name: 'Pretendard', value: 'Pretendard, sans-serif' },
    { name: 'Noto Sans KR', value: '"Noto Sans KR", sans-serif' },
    { name: 'Nanum Gothic', value: '"Nanum Gothic", sans-serif' },
    { name: 'Nanum Myeongjo', value: '"Nanum Myeongjo", serif' },
    { name: 'Black Han Sans', value: '"Black Han Sans", sans-serif' },
    { name: 'Jua', value: '"Jua", sans-serif' },
    { name: 'Gothic A1', value: '"Gothic A1", sans-serif' }
];

const FONT_WEIGHTS = [
    { name: 'Light', value: '300' },
    { name: 'Regular', value: '400' },
    { name: 'Medium', value: '500' },
    { name: 'Bold', value: '700' },
    { name: 'Black', value: '900' }
];

// Helper to convert hex to rgba
const hexToRgba = (hex, alpha = 1) => {
    // Validate hex input
    if (!hex || typeof hex !== 'string' || !hex.startsWith('#') || hex.length < 7) {
        return `rgba(128, 128, 128, ${alpha})`; // fallback gray
    }
    try {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        if (isNaN(r) || isNaN(g) || isNaN(b)) {
            return `rgba(128, 128, 128, ${alpha})`;
        }
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    } catch {
        return `rgba(128, 128, 128, ${alpha})`;
    }
};

// Aspect ratio configurations
const ASPECT_RATIO_SIZES = {
    '1:1': { width: 400, height: 400 },
    '4:5': { width: 360, height: 450 },
    '9:16': { width: 280, height: 498 },
    '16:9': { width: 520, height: 293 },
    '3:4': { width: 360, height: 480 }
};

function Studio({ canvasBg, setCanvasBg, canvasObjects, setCanvasObjects, canvasAspectRatio, setCanvasAspectRatio, onSave, topic }) {
    const [selectedObjId, setSelectedObjId] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isResizing, setIsResizing] = useState(false);
    const [isGradHandleDragging, setIsGradHandleDragging] = useState(false);
    const [resizeHandle, setResizeHandle] = useState(null);
    const [activeGradHandle, setActiveGradHandle] = useState(null);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [initialDims, setInitialDims] = useState({ x: 0, y: 0, width: 0, height: 0 });
    const [selectedGradientStop, setSelectedGradientStop] = useState(0);
    const [editingTextId, setEditingTextId] = useState(null);
    const [draggingStopIndex, setDraggingStopIndex] = useState(null);
    const [transformingObjId, setTransformingObjId] = useState(null); // Free transform mode
    const [guides, setGuides] = useState({ vertical: [], horizontal: [] }); // Smart guides
    const [imageEditingId, setImageEditingId] = useState(null); // Image crop/mask edit mode
    const [isImageDragging, setIsImageDragging] = useState(false); // Dragging image inside frame
    const [imageDragStart, setImageDragStart] = useState({ x: 0, y: 0 });
    const [initialImageProps, setInitialImageProps] = useState({ imgX: 0, imgY: 0, imgScale: 1 });
    // Background image editing states
    const [isBgEditing, setIsBgEditing] = useState(false);
    const [isBgDragging, setIsBgDragging] = useState(false);
    const [bgDragStart, setBgDragStart] = useState({ x: 0, y: 0 });
    const [bgOffset, setBgOffset] = useState({ x: 0, y: 0 });
    const [bgScale, setBgScale] = useState(1);
    const [initialBgProps, setInitialBgProps] = useState({ x: 0, y: 0, scale: 1 });
    const textInputRef = useRef(null);
    const gradientBarRef = useRef(null);
    const imageInputRef = useRef(null);

    // Calculate canvas dimensions from aspect ratio
    const canvasDims = ASPECT_RATIO_SIZES[canvasAspectRatio] || ASPECT_RATIO_SIZES['1:1'];

    const createBaseObject = (type, overrides = {}) => ({
        id: Date.now(),
        type,
        x: 100, y: 100,
        width: 200, height: 200,
        color: '#000000',
        opacity: 1,
        borderRadius: type === 'circle' ? 100 : 0,
        strokeWidth: 0,
        strokeColor: '#000000',
        isGradient: false,
        // Advanced gradient stops: array of { position: 0-100, color: hex, alpha: 0-1 }
        gradientStops: [
            { position: 0, color: '#FF007A', alpha: 1 },
            { position: 100, color: '#6366F1', alpha: 1 }
        ],
        gradientAngle: 180,
        // Effects array: each effect has type, enabled, and properties
        effects: [],
        // Free transform properties
        skewX: 0,
        skewY: 0,
        // Image frame properties (for image type)
        imgX: 0, // Image offset X within frame
        imgY: 0, // Image offset Y within frame
        imgScale: 1, // Image scale within frame
        ...overrides
    });

    // ESC/Enter key handler to exit transform mode, text editing, and image editing
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' || e.key === 'Enter') {
                setTransformingObjId(null);
                if (e.key === 'Escape') setEditingTextId(null);
                setImageEditingId(null);
                setIsBgEditing(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Auto-convert canvasBg to image layer when it's set
    useEffect(() => {
        if (canvasBg) {
            const img = new window.Image();
            img.onload = () => {
                setCanvasObjects(prev => {
                    // Prevent adding duplicate background images
                    if (prev.some(o => o.isBackgroundImage)) return prev;
                    if (prev.some(o => o.type === 'image' && o.src === canvasBg)) return prev;

                    const newObj = createBaseObject('image', {
                        id: Date.now(),
                        x: 0,
                        y: 0,
                        width: canvasDims.width,
                        height: canvasDims.height,
                        src: canvasBg,
                        originalWidth: img.width,
                        originalHeight: img.height,
                        isBackgroundImage: true // Mark as the original background
                    });

                    // Add new image layer at the bottom (beginning of array)
                    // If there are existing objects (like the text from App.jsx), keep them on top
                    return [newObj, ...prev];
                });
                // Optional: Select the new object if it's the only one, or let user decide?
                // setCanvasObjects handles state, but we can't easily set selection here 
                // without potentially race conditions or overriding text selection.
                // Better to leave selection as is (likely the text object).
            };
            img.src = canvasBg;
        }
    }, [canvasBg, canvasDims.width, canvasDims.height]);

    const addTextLayer = () => {
        const newObj = createBaseObject('text', {
            text: '텍스트 입력',
            x: 100, y: 150,
            width: 200, height: 60,
            bg: 'transparent',
            fontSize: 24,
            fontWeight: '700',
            fontFamily: 'sans-serif',
            textAlign: 'left'
        });
        setCanvasObjects([...canvasObjects, newObj]);
        setSelectedObjId(newObj.id);
    };

    const addShapeLayer = (type) => {
        const newObj = createBaseObject(type, {
            x: 125, y: 125,
            width: 150, height: 150,
            color: '#FF007A',
            isGradient: false
        });
        setCanvasObjects([...canvasObjects, newObj]);
        setSelectedObjId(newObj.id);
    };

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new window.Image();
            img.onload = () => {
                // Calculate size to fit within canvas while maintaining aspect ratio
                const maxWidth = canvasDims.width * 0.8;
                const maxHeight = canvasDims.height * 0.8;
                let width = img.width;
                let height = img.height;

                if (width > maxWidth) {
                    height = (maxWidth / width) * height;
                    width = maxWidth;
                }
                if (height > maxHeight) {
                    width = (maxHeight / height) * width;
                    height = maxHeight;
                }

                const newObj = createBaseObject('image', {
                    x: (canvasDims.width - width) / 2,
                    y: (canvasDims.height - height) / 2,
                    width,
                    height,
                    src: event.target.result,
                    originalWidth: img.width,
                    originalHeight: img.height
                });
                setCanvasObjects([...canvasObjects, newObj]);
                setSelectedObjId(newObj.id);
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
        // Reset input so same file can be selected again
        e.target.value = '';
    };

    const addImageFromBackground = () => {
        if (!canvasBg) return;

        const img = new window.Image();
        img.onload = () => {
            // Calculate size to fit within canvas while maintaining aspect ratio
            const maxWidth = canvasDims.width * 0.6;
            const maxHeight = canvasDims.height * 0.6;
            let width = img.width;
            let height = img.height;

            if (width > maxWidth) {
                height = (maxWidth / width) * height;
                width = maxWidth;
            }
            if (height > maxHeight) {
                width = (maxHeight / height) * width;
                height = maxHeight;
            }

            const newObj = createBaseObject('image', {
                x: (canvasDims.width - width) / 2,
                y: (canvasDims.height - height) / 2,
                width,
                height,
                src: canvasBg,
                originalWidth: img.width,
                originalHeight: img.height
            });
            setCanvasObjects([...canvasObjects, newObj]);
            setSelectedObjId(newObj.id);
        };
        img.src = canvasBg;
    };

    const updateObjProp = (id, prop, value) => {
        setCanvasObjects(canvasObjects.map(obj =>
            obj.id === id ? { ...obj, [prop]: value } : obj
        ));
    };

    // Update multiple properties at once (atomic update)
    const updateObjMultiProp = (id, updates) => {
        setCanvasObjects(canvasObjects.map(obj =>
            obj.id === id ? { ...obj, ...updates } : obj
        ));
    };

    // Gradient Stop Management
    const updateGradientStop = (objId, stopIndex, updates) => {
        setCanvasObjects(canvasObjects.map(obj => {
            if (obj.id !== objId) return obj;
            const newStops = [...(obj.gradientStops || [])];
            newStops[stopIndex] = { ...newStops[stopIndex], ...updates };
            return { ...obj, gradientStops: newStops };
        }));
    };

    const addGradientStop = (objId, position) => {
        setCanvasObjects(canvasObjects.map(obj => {
            if (obj.id !== objId) return obj;
            // Ensure we have at least 2 default stops
            const stops = (obj.gradientStops && obj.gradientStops.length >= 2) ? obj.gradientStops : [
                { position: 0, color: '#FF007A', alpha: 1 },
                { position: 100, color: '#6366F1', alpha: 1 }
            ];
            // Find surrounding colors and interpolate
            let leftStop = stops[0];
            let rightStop = stops[stops.length - 1];
            for (let i = 0; i < stops.length - 1; i++) {
                if (stops[i].position <= position && stops[i + 1].position >= position) {
                    leftStop = stops[i];
                    rightStop = stops[i + 1];
                    break;
                }
            }
            const newStop = { position, color: leftStop.color, alpha: 1 };
            const newStops = [...stops, newStop].sort((a, b) => a.position - b.position);
            return { ...obj, gradientStops: newStops };
        }));
    };

    const removeGradientStop = (objId, stopIndex) => {
        setCanvasObjects(canvasObjects.map(obj => {
            if (obj.id !== objId) return obj;
            const stops = obj.gradientStops || [];
            if (stops.length <= 2) return obj; // Keep at least 2 stops
            const newStops = stops.filter((_, i) => i !== stopIndex);
            return { ...obj, gradientStops: newStops };
        }));
    };

    // Effects Management
    const addEffect = (objId, effectType) => {
        const defaultEffects = {
            dropShadow: { type: 'dropShadow', enabled: true, x: 4, y: 4, blur: 10, spread: 0, color: '#000000', opacity: 0.25 },
            layerBlur: { type: 'layerBlur', enabled: true, blur: 5 }
        };
        setCanvasObjects(canvasObjects.map(obj => {
            if (obj.id !== objId) return obj;
            const effects = obj.effects || [];
            return { ...obj, effects: [...effects, { ...defaultEffects[effectType], id: Date.now() }] };
        }));
    };

    const updateEffect = (objId, effectId, updates) => {
        setCanvasObjects(canvasObjects.map(obj => {
            if (obj.id !== objId) return obj;
            const effects = (obj.effects || []).map(eff =>
                eff.id === effectId ? { ...eff, ...updates } : eff
            );
            return { ...obj, effects };
        }));
    };

    const removeEffect = (objId, effectId) => {
        setCanvasObjects(canvasObjects.map(obj => {
            if (obj.id !== objId) return obj;
            const effects = (obj.effects || []).filter(eff => eff.id !== effectId);
            return { ...obj, effects };
        }));
    };

    const toggleEffect = (objId, effectId) => {
        setCanvasObjects(canvasObjects.map(obj => {
            if (obj.id !== objId) return obj;
            const effects = (obj.effects || []).map(eff =>
                eff.id === effectId ? { ...eff, enabled: !eff.enabled } : eff
            );
            return { ...obj, effects };
        }));
    };

    // Generate CSS gradient string from stops
    const getGradientCSS = (obj) => {
        if (!obj) return '#808080';
        if (!obj.isGradient) return obj.color || '#808080';

        // Ensure we have valid gradient stops
        let stops = obj.gradientStops;
        if (!stops || !Array.isArray(stops) || stops.length < 2) {
            stops = [
                { position: 0, color: '#FF007A', alpha: 1 },
                { position: 100, color: '#6366F1', alpha: 1 }
            ];
        }

        // Validate each stop has required properties
        const validatedStops = stops.map(s => ({
            position: typeof s.position === 'number' ? s.position : 0,
            color: (s.color && typeof s.color === 'string') ? s.color : '#808080',
            alpha: typeof s.alpha === 'number' ? s.alpha : 1
        }));

        const angle = obj.gradientAngle || 180;
        const colorStops = validatedStops
            .sort((a, b) => a.position - b.position)
            .map(s => `${hexToRgba(s.color, s.alpha)} ${s.position}%`)
            .join(', ');
        return `linear-gradient(${angle}deg, ${colorStops})`;
    };

    // Generate CSS for effects (box-shadow and filter)
    const getEffectStyles = (obj) => {
        if (!obj) return { boxShadow: 'none', filter: 'none' };

        const effects = obj.effects || [];
        const shadows = [];
        let filterBlur = 0;

        effects.forEach(eff => {
            if (!eff || !eff.enabled) return;
            if (eff.type === 'dropShadow') {
                const x = typeof eff.x === 'number' ? eff.x : 0;
                const y = typeof eff.y === 'number' ? eff.y : 0;
                const blur = typeof eff.blur === 'number' ? eff.blur : 0;
                const spread = typeof eff.spread === 'number' ? eff.spread : 0;
                const color = eff.color || '#000000';
                const opacity = typeof eff.opacity === 'number' ? eff.opacity : 0.25;
                shadows.push(`${x}px ${y}px ${blur}px ${spread}px ${hexToRgba(color, opacity)}`);
            } else if (eff.type === 'layerBlur') {
                const blur = typeof eff.blur === 'number' ? eff.blur : 0;
                filterBlur = Math.max(filterBlur, blur);
            }
        });

        return {
            boxShadow: shadows.length > 0 ? shadows.join(', ') : 'none',
            filter: filterBlur > 0 ? `blur(${filterBlur}px)` : 'none'
        };
    };

    const moveLayer = (direction) => {
        if (!selectedObjId) return;
        const index = canvasObjects.findIndex(o => o.id === selectedObjId);
        if (index === -1) return;
        const newObjects = [...canvasObjects];
        const [item] = newObjects.splice(index, 1);
        if (direction === 'front') newObjects.push(item);
        else if (direction === 'back') newObjects.unshift(item);
        else if (direction === 'forward') newObjects.splice(Math.min(newObjects.length, index + 1), 0, item);
        else if (direction === 'backward') newObjects.splice(Math.max(0, index - 1), 0, item);
        setCanvasObjects(newObjects);
    };

    const handleMouseDown = (e, id) => {
        e.stopPropagation();
        setSelectedObjId(id);
        setIsDragging(true);
        const obj = canvasObjects.find(o => o.id === id);
        setDragStart({ x: e.clientX, y: e.clientY });
        setInitialDims({ x: obj.x, y: obj.y, width: obj.width, height: obj.height });
    };

    const handleGradHandleStart = (e, id, handleType) => {
        e.stopPropagation();
        e.preventDefault();
        setSelectedObjId(id);
        setIsGradHandleDragging(true);
        setActiveGradHandle(handleType);
        setSelectedGradientStop(handleType === 'start' ? 0 : 1);
    };

    const handleResizeStart = (e, id, handle) => {
        e.stopPropagation();
        e.preventDefault();
        setSelectedObjId(id);
        setIsResizing(true);
        setResizeHandle(handle);
        const obj = canvasObjects.find(o => o.id === id);
        setDragStart({ x: e.clientX, y: e.clientY });
        setInitialDims({ x: obj.x, y: obj.y, width: obj.width, height: obj.height });
    };

    // Smart snap calculation - returns snapped position and guide lines
    const SNAP_THRESHOLD = 8; // 8px threshold for better detection
    const calculateSnap = (objId, x, y, width, height) => {
        const newGuides = { vertical: [], horizontal: [] };

        const canvasCenterX = canvasDims.width / 2;
        const canvasCenterY = canvasDims.height / 2;
        const objCenterX = x + width / 2;
        const objCenterY = y + height / 2;
        const objRight = x + width;
        const objBottom = y + height;

        // Collect all possible snap points with their distances
        const verticalSnaps = []; // { targetX, guideX, distance, priority }
        const horizontalSnaps = []; // { targetY, guideY, distance, priority }

        // Canvas center snap (highest priority = 1)
        const centerXDist = Math.abs(objCenterX - canvasCenterX);
        if (centerXDist < SNAP_THRESHOLD) {
            verticalSnaps.push({
                targetX: canvasCenterX - width / 2,
                guideX: canvasCenterX,
                distance: centerXDist,
                priority: 1
            });
        }
        const centerYDist = Math.abs(objCenterY - canvasCenterY);
        if (centerYDist < SNAP_THRESHOLD) {
            horizontalSnaps.push({
                targetY: canvasCenterY - height / 2,
                guideY: canvasCenterY,
                distance: centerYDist,
                priority: 1
            });
        }

        // Canvas edge snaps (priority = 2)
        const leftDist = Math.abs(x);
        if (leftDist < SNAP_THRESHOLD) {
            verticalSnaps.push({ targetX: 0, guideX: 0, distance: leftDist, priority: 2 });
        }
        const rightDist = Math.abs(objRight - canvasDims.width);
        if (rightDist < SNAP_THRESHOLD) {
            verticalSnaps.push({ targetX: canvasDims.width - width, guideX: canvasDims.width, distance: rightDist, priority: 2 });
        }
        const topDist = Math.abs(y);
        if (topDist < SNAP_THRESHOLD) {
            horizontalSnaps.push({ targetY: 0, guideY: 0, distance: topDist, priority: 2 });
        }
        const bottomDist = Math.abs(objBottom - canvasDims.height);
        if (bottomDist < SNAP_THRESHOLD) {
            horizontalSnaps.push({ targetY: canvasDims.height - height, guideY: canvasDims.height, distance: bottomDist, priority: 2 });
        }

        // Object-to-object snap (priority = 3)
        canvasObjects.forEach(other => {
            if (other.id === objId) return;
            const otherCenterX = other.x + other.width / 2;
            const otherCenterY = other.y + other.height / 2;
            const otherRight = other.x + other.width;
            const otherBottom = other.y + other.height;

            // Center-to-center
            const objOtherCenterXDist = Math.abs(objCenterX - otherCenterX);
            if (objOtherCenterXDist < SNAP_THRESHOLD) {
                verticalSnaps.push({ targetX: otherCenterX - width / 2, guideX: otherCenterX, distance: objOtherCenterXDist, priority: 3 });
            }
            const objOtherCenterYDist = Math.abs(objCenterY - otherCenterY);
            if (objOtherCenterYDist < SNAP_THRESHOLD) {
                horizontalSnaps.push({ targetY: otherCenterY - height / 2, guideY: otherCenterY, distance: objOtherCenterYDist, priority: 3 });
            }
            // Edge alignments
            const leftEdgeDist = Math.abs(x - other.x);
            if (leftEdgeDist < SNAP_THRESHOLD) {
                verticalSnaps.push({ targetX: other.x, guideX: other.x, distance: leftEdgeDist, priority: 3 });
            }
            const rightEdgeDist = Math.abs(objRight - otherRight);
            if (rightEdgeDist < SNAP_THRESHOLD) {
                verticalSnaps.push({ targetX: otherRight - width, guideX: otherRight, distance: rightEdgeDist, priority: 3 });
            }
            const topEdgeDist = Math.abs(y - other.y);
            if (topEdgeDist < SNAP_THRESHOLD) {
                horizontalSnaps.push({ targetY: other.y, guideY: other.y, distance: topEdgeDist, priority: 3 });
            }
            const bottomEdgeDist = Math.abs(objBottom - otherBottom);
            if (bottomEdgeDist < SNAP_THRESHOLD) {
                horizontalSnaps.push({ targetY: otherBottom - height, guideY: otherBottom, distance: bottomEdgeDist, priority: 3 });
            }
        });

        // Sort by priority first, then by distance
        verticalSnaps.sort((a, b) => a.priority - b.priority || a.distance - b.distance);
        horizontalSnaps.sort((a, b) => a.priority - b.priority || a.distance - b.distance);

        // Apply best snap (if any)
        let snappedX = x, snappedY = y;

        if (verticalSnaps.length > 0) {
            const best = verticalSnaps[0];
            snappedX = best.targetX;
            newGuides.vertical.push(best.guideX);
        }
        if (horizontalSnaps.length > 0) {
            const best = horizontalSnaps[0];
            snappedY = best.targetY;
            newGuides.horizontal.push(best.guideY);
        }

        return { snappedX, snappedY, guides: newGuides };
    };

    // Resize snap calculation - snaps edges during resize
    const calculateResizeSnap = (objId, x, y, width, height, handle) => {
        const newGuides = { vertical: [], horizontal: [] };
        let snappedX = x, snappedY = y, snappedW = width, snappedH = height;

        const objRight = x + width;
        const objBottom = y + height;
        const canvasCenterX = canvasDims.width / 2;
        const canvasCenterY = canvasDims.height / 2;
        const objCenterX = x + width / 2;
        const objCenterY = y + height / 2;

        // Collect snap targets for edges being resized
        const RESIZE_SNAP_THRESHOLD = 8;

        // Right edge snapping (when resizing east)
        if (handle.includes('e')) {
            // Snap to canvas right edge
            if (Math.abs(objRight - canvasDims.width) < RESIZE_SNAP_THRESHOLD) {
                snappedW = canvasDims.width - x;
                newGuides.vertical.push(canvasDims.width);
            }
            // Snap to canvas center
            else if (Math.abs(objRight - canvasCenterX) < RESIZE_SNAP_THRESHOLD) {
                snappedW = canvasCenterX - x;
                newGuides.vertical.push(canvasCenterX);
            }
            // Snap to other objects' edges
            canvasObjects.forEach(other => {
                if (other.id === objId) return;
                const otherRight = other.x + other.width;
                if (Math.abs(objRight - other.x) < RESIZE_SNAP_THRESHOLD) {
                    snappedW = other.x - x;
                    newGuides.vertical.push(other.x);
                } else if (Math.abs(objRight - otherRight) < RESIZE_SNAP_THRESHOLD) {
                    snappedW = otherRight - x;
                    newGuides.vertical.push(otherRight);
                }
            });
        }

        // Left edge snapping (when resizing west)
        if (handle.includes('w')) {
            // Snap to canvas left edge
            if (Math.abs(x) < RESIZE_SNAP_THRESHOLD) {
                snappedW = width + snappedX;
                snappedX = 0;
                newGuides.vertical.push(0);
            }
            // Snap to canvas center
            else if (Math.abs(x - canvasCenterX) < RESIZE_SNAP_THRESHOLD) {
                snappedW = width + (snappedX - canvasCenterX);
                snappedX = canvasCenterX;
                newGuides.vertical.push(canvasCenterX);
            }
            // Snap to other objects' edges
            canvasObjects.forEach(other => {
                if (other.id === objId) return;
                const otherRight = other.x + other.width;
                if (Math.abs(x - other.x) < RESIZE_SNAP_THRESHOLD) {
                    snappedW = width + (snappedX - other.x);
                    snappedX = other.x;
                    newGuides.vertical.push(other.x);
                } else if (Math.abs(x - otherRight) < RESIZE_SNAP_THRESHOLD) {
                    snappedW = width + (snappedX - otherRight);
                    snappedX = otherRight;
                    newGuides.vertical.push(otherRight);
                }
            });
        }

        // Bottom edge snapping (when resizing south)
        if (handle.includes('s')) {
            // Snap to canvas bottom edge
            if (Math.abs(objBottom - canvasDims.height) < RESIZE_SNAP_THRESHOLD) {
                snappedH = canvasDims.height - y;
                newGuides.horizontal.push(canvasDims.height);
            }
            // Snap to canvas center
            else if (Math.abs(objBottom - canvasCenterY) < RESIZE_SNAP_THRESHOLD) {
                snappedH = canvasCenterY - y;
                newGuides.horizontal.push(canvasCenterY);
            }
            // Snap to other objects' edges
            canvasObjects.forEach(other => {
                if (other.id === objId) return;
                const otherBottom = other.y + other.height;
                if (Math.abs(objBottom - other.y) < RESIZE_SNAP_THRESHOLD) {
                    snappedH = other.y - y;
                    newGuides.horizontal.push(other.y);
                } else if (Math.abs(objBottom - otherBottom) < RESIZE_SNAP_THRESHOLD) {
                    snappedH = otherBottom - y;
                    newGuides.horizontal.push(otherBottom);
                }
            });
        }

        // Top edge snapping (when resizing north)
        if (handle.includes('n')) {
            // Snap to canvas top edge
            if (Math.abs(y) < RESIZE_SNAP_THRESHOLD) {
                snappedH = height + snappedY;
                snappedY = 0;
                newGuides.horizontal.push(0);
            }
            // Snap to canvas center
            else if (Math.abs(y - canvasCenterY) < RESIZE_SNAP_THRESHOLD) {
                snappedH = height + (snappedY - canvasCenterY);
                snappedY = canvasCenterY;
                newGuides.horizontal.push(canvasCenterY);
            }
            // Snap to other objects' edges
            canvasObjects.forEach(other => {
                if (other.id === objId) return;
                const otherBottom = other.y + other.height;
                if (Math.abs(y - other.y) < RESIZE_SNAP_THRESHOLD) {
                    snappedH = height + (snappedY - other.y);
                    snappedY = other.y;
                    newGuides.horizontal.push(other.y);
                } else if (Math.abs(y - otherBottom) < RESIZE_SNAP_THRESHOLD) {
                    snappedH = height + (snappedY - otherBottom);
                    snappedY = otherBottom;
                    newGuides.horizontal.push(otherBottom);
                }
            });
        }

        // Ensure minimum size
        snappedW = Math.max(20, snappedW);
        snappedH = Math.max(20, snappedH);

        return { snappedX, snappedY, snappedW, snappedH, guides: newGuides };
    };

    const handleMouseMove = (e) => {
        if (selectedObjId === null) return;
        const obj = canvasObjects.find(o => o.id === selectedObjId);
        if (!obj) return;

        if (isDragging) {
            const deltaX = e.clientX - dragStart.x;
            const deltaY = e.clientY - dragStart.y;
            const newX = initialDims.x + deltaX;
            const newY = initialDims.y + deltaY;

            // Apply smart snap
            const { snappedX, snappedY, guides: newGuides } = calculateSnap(
                selectedObjId, newX, newY, obj.width, obj.height
            );

            setGuides(newGuides);
            setCanvasObjects(canvasObjects.map(o =>
                o.id === selectedObjId
                    ? { ...o, x: snappedX, y: snappedY }
                    : o
            ));
        }
        else if (isResizing) {
            const deltaX = e.clientX - dragStart.x;
            const deltaY = e.clientY - dragStart.y;
            let newW = initialDims.width;
            let newH = initialDims.height;
            let newX = initialDims.x;
            let newY = initialDims.y;

            if (resizeHandle.includes('e')) newW = Math.max(20, initialDims.width + deltaX);
            if (resizeHandle.includes('w')) {
                newW = Math.max(20, initialDims.width - deltaX);
                newX = initialDims.x + (initialDims.width - newW);
            }
            if (resizeHandle.includes('s')) newH = Math.max(20, initialDims.height + deltaY);
            if (resizeHandle.includes('n')) {
                newH = Math.max(20, initialDims.height - deltaY);
                newY = initialDims.y + (initialDims.height - newH);
            }

            // Apply resize snap
            const {
                snappedX, snappedY, snappedW, snappedH, guides: resizeGuides
            } = calculateResizeSnap(selectedObjId, newX, newY, newW, newH, resizeHandle);

            setGuides(resizeGuides);
            setCanvasObjects(canvasObjects.map(o =>
                o.id === selectedObjId ? { ...o, x: snappedX, y: snappedY, width: snappedW, height: snappedH } : o
            ));
        }
        else if (isGradHandleDragging) {
            // Gradient handle dragging is now handled via the slider UI, not canvas handles
            // This code block is kept for potential future canvas-based angle control
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
        setIsResizing(false);
        setIsGradHandleDragging(false);
        setIsImageDragging(false); // 이미지 편집 드래그 종료
        setIsBgDragging(false); // 배경 이미지 드래그 종료
        setResizeHandle(null);
        setActiveGradHandle(null);
        setDraggingStopIndex(null); // 그라데이션 스탑 드래그 상태 초기화
        setGuides({ vertical: [], horizontal: [] }); // Clear smart guides
    };

    // Handle background image editing
    const handleBgEditMouseDown = (e) => {
        e.stopPropagation();
        setIsBgDragging(true);
        setBgDragStart({ x: e.clientX, y: e.clientY });
        setInitialBgProps({ x: bgOffset.x, y: bgOffset.y, scale: bgScale });
    };

    const handleBgEditMouseMove = (e) => {
        if (!isBgDragging || !isBgEditing) return;

        const deltaX = e.clientX - bgDragStart.x;
        const deltaY = e.clientY - bgDragStart.y;

        setBgOffset({
            x: initialBgProps.x + deltaX,
            y: initialBgProps.y + deltaY
        });
    };

    // Handle image editing mode - drag image inside frame
    const handleImageEditMouseDown = (e, objId) => {
        e.stopPropagation();
        const obj = canvasObjects.find(o => o.id === objId);
        if (!obj) return;

        setIsImageDragging(true);
        setImageDragStart({ x: e.clientX, y: e.clientY });
        setInitialImageProps({
            imgX: obj.imgX || 0,
            imgY: obj.imgY || 0,
            imgScale: obj.imgScale || 1
        });
    };

    const handleImageEditMouseMove = (e) => {
        if (!isImageDragging || !imageEditingId) return;

        const deltaX = e.clientX - imageDragStart.x;
        const deltaY = e.clientY - imageDragStart.y;

        setCanvasObjects(canvasObjects.map(o =>
            o.id === imageEditingId
                ? { ...o, imgX: initialImageProps.imgX + deltaX, imgY: initialImageProps.imgY + deltaY }
                : o
        ));
    };

    const handleImageScaleChange = (objId, newScale) => {
        setCanvasObjects(canvasObjects.map(o =>
            o.id === objId ? { ...o, imgScale: newScale } : o
        ));
    };

    const downloadCompositeImage = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        // Use higher resolution for export (2x)
        const exportScale = 2;
        canvas.width = canvasDims.width * exportScale;
        canvas.height = canvasDims.height * exportScale;

        // Fill white background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const scale = exportScale;

        canvasObjects.forEach(obj => {
            ctx.save();
            ctx.globalAlpha = obj.opacity;
            const x = obj.x * scale;
            const y = obj.y * scale;
            const w = obj.width * scale;
            const h = obj.height * scale;
            const radius = (obj.type === 'circle' ? Math.min(w, h) / 2 : obj.borderRadius) * scale;

            // Apply effects (drop shadow)
            const effects = obj.effects || [];
            effects.forEach(eff => {
                if (!eff.enabled) return;
                if (eff.type === 'dropShadow') {
                    ctx.shadowColor = hexToRgba(eff.color, eff.opacity);
                    ctx.shadowBlur = eff.blur * scale;
                    ctx.shadowOffsetX = eff.x * scale;
                    ctx.shadowOffsetY = eff.y * scale;
                }
            });

            ctx.beginPath();
            if (obj.type === 'circle') ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, 2 * Math.PI);
            else ctx.roundRect(x, y, w, h, radius);
            ctx.closePath();

            let fillStyle = obj.color;
            if (obj.isGradient) {
                const stops = obj.gradientStops || [
                    { position: 0, color: '#FF007A', alpha: 1 },
                    { position: 100, color: '#6366F1', alpha: 1 }
                ];
                const angle = (obj.gradientAngle || 180) * Math.PI / 180;
                const centerX = x + w / 2;
                const centerY = y + h / 2;
                const length = Math.sqrt(w * w + h * h) / 2;
                const gx1 = centerX - Math.sin(angle) * length;
                const gy1 = centerY - Math.cos(angle) * length;
                const gx2 = centerX + Math.sin(angle) * length;
                const gy2 = centerY + Math.cos(angle) * length;
                const grad = ctx.createLinearGradient(gx1, gy1, gx2, gy2);

                stops.sort((a, b) => a.position - b.position).forEach(stop => {
                    grad.addColorStop(stop.position / 100, hexToRgba(stop.color, stop.alpha));
                });
                fillStyle = grad;
            }

            if (obj.type !== 'text' && obj.type !== 'image' || (obj.bg && obj.bg !== 'transparent')) {
                ctx.fillStyle = obj.type === 'text' ? obj.bg : fillStyle;
                ctx.fill();
            }

            if (obj.strokeWidth > 0 && obj.type !== 'image') {
                ctx.lineWidth = obj.strokeWidth * scale;
                ctx.strokeStyle = obj.strokeColor;
                ctx.stroke();
            }

            // Draw image objects with imgX, imgY, imgScale support
            if (obj.type === 'image' && obj.src) {
                const imgEl = new window.Image();
                imgEl.crossOrigin = 'Anonymous';
                imgEl.src = obj.src;
                try {
                    ctx.save();
                    ctx.beginPath();
                    ctx.roundRect(x, y, w, h, (obj.borderRadius || 0) * scale);
                    ctx.clip();

                    const imgX = x + (obj.imgX || 0) * scale;
                    const imgY = y + (obj.imgY || 0) * scale;
                    const imgScale = obj.imgScale || 1;

                    if (imgScale !== 1 || obj.imgX || obj.imgY) {
                        const imgW = (obj.originalWidth || obj.width) * imgScale * scale;
                        const imgH = (obj.originalHeight || obj.height) * imgScale * scale;
                        ctx.drawImage(imgEl, imgX, imgY, imgW, imgH);
                    } else {
                        ctx.drawImage(imgEl, x, y, w, h);
                    }
                    ctx.restore();
                } catch (e) {
                    console.warn('Could not draw image:', e);
                }
            }

            if (obj.type === 'text') {
                ctx.shadowColor = 'transparent';
                ctx.fillStyle = obj.isGradient ? fillStyle : obj.color;
                ctx.font = `${obj.fontWeight} ${obj.fontSize * scale}px ${obj.fontFamily || 'sans-serif'}`;
                ctx.textAlign = obj.textAlign || 'left';
                ctx.textBaseline = 'top';
                let textX = x + (10 * scale);
                if (obj.textAlign === 'center') textX = x + w / 2;
                else if (obj.textAlign === 'right') textX = x + w - (10 * scale);

                const lines = (obj.text || '').split('\n');
                const lineHeight = obj.fontSize * scale * 1.4;
                lines.forEach((line, index) => {
                    ctx.fillText(line, textX, y + (10 * scale) + (index * lineHeight));
                });
            }
            ctx.restore();
        });

        const link = document.createElement('a');
        link.download = `marketing_studio_${Date.now()}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();

        if (onSave && canvasBg) {
            onSave(canvasBg, topic);
        }
    };

    const activeObj = canvasObjects.find(t => t.id === selectedObjId);

    return (
        <div
            style={{ display: 'flex', height: '100%', overflow: 'hidden' }}
            onMouseMove={(e) => {
                handleMouseMove(e);
                handleImageEditMouseMove(e);
                handleBgEditMouseMove(e);
            }}
            onMouseUp={handleMouseUp}
            onClick={(e) => {
                // Click outside image editing area exits edit mode
                if (imageEditingId && e.target.id === 'design-canvas-area') {
                    setImageEditingId(null);
                }
            }}
        >
            {/* Inspector Panel */}
            <div className="custom-scrollbar" style={{
                width: '320px',
                backgroundColor: 'white',
                borderRight: '1px solid #E2E8F0',
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                overflow: 'auto',
                flexShrink: 0
            }}>
                {/* Tool Buttons */}
                <div style={{
                    padding: '16px',
                    borderBottom: '1px solid #F1F5F9',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: '8px',
                    position: 'sticky',
                    top: 0,
                    backgroundColor: 'white',
                    zIndex: 10
                }}>
                    {/* Hidden file input for image upload */}
                    <input
                        type="file"
                        ref={imageInputRef}
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={handleImageUpload}
                    />
                    <button
                        onClick={addTextLayer}
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '12px',
                            border: '1px solid #E2E8F0',
                            borderRadius: '12px',
                            backgroundColor: 'white',
                            cursor: 'pointer',
                            transition: 'all 0.15s'
                        }}
                        onMouseOver={e => { e.currentTarget.style.backgroundColor = '#FDF2F8'; e.currentTarget.style.borderColor = '#FF007A'; }}
                        onMouseOut={e => { e.currentTarget.style.backgroundColor = 'white'; e.currentTarget.style.borderColor = '#E2E8F0'; }}
                    >
                        <Type size={20} />
                        <span style={{ fontSize: '10px', fontWeight: '600', marginTop: '4px' }}>텍스트</span>
                    </button>
                    <button
                        onClick={() => addShapeLayer('rect')}
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '12px',
                            border: '1px solid #E2E8F0',
                            borderRadius: '12px',
                            backgroundColor: 'white',
                            cursor: 'pointer',
                            transition: 'all 0.15s'
                        }}
                        onMouseOver={e => { e.currentTarget.style.backgroundColor = '#FDF2F8'; e.currentTarget.style.borderColor = '#FF007A'; }}
                        onMouseOut={e => { e.currentTarget.style.backgroundColor = 'white'; e.currentTarget.style.borderColor = '#E2E8F0'; }}
                    >
                        <Square size={20} />
                        <span style={{ fontSize: '10px', fontWeight: '600', marginTop: '4px' }}>네모</span>
                    </button>
                    <button
                        onClick={() => addShapeLayer('circle')}
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '12px',
                            border: '1px solid #E2E8F0',
                            borderRadius: '12px',
                            backgroundColor: 'white',
                            cursor: 'pointer',
                            transition: 'all 0.15s'
                        }}
                        onMouseOver={e => { e.currentTarget.style.backgroundColor = '#FDF2F8'; e.currentTarget.style.borderColor = '#FF007A'; }}
                        onMouseOut={e => { e.currentTarget.style.backgroundColor = 'white'; e.currentTarget.style.borderColor = '#E2E8F0'; }}
                    >
                        <Circle size={20} />
                        <span style={{ fontSize: '10px', fontWeight: '600', marginTop: '4px' }}>원</span>
                    </button>
                    <button
                        onClick={() => imageInputRef.current?.click()}
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '12px',
                            border: '1px solid #E2E8F0',
                            borderRadius: '12px',
                            backgroundColor: 'white',
                            cursor: 'pointer',
                            transition: 'all 0.15s'
                        }}
                        onMouseOver={e => { e.currentTarget.style.backgroundColor = '#FDF2F8'; e.currentTarget.style.borderColor = '#FF007A'; }}
                        onMouseOut={e => { e.currentTarget.style.backgroundColor = 'white'; e.currentTarget.style.borderColor = '#E2E8F0'; }}
                    >
                        <Image size={20} />
                        <span style={{ fontSize: '10px', fontWeight: '600', marginTop: '4px' }}>이미지</span>
                    </button>
                </div>

                {/* Canvas Aspect Ratio Selector */}
                <div style={{
                    padding: '12px 16px',
                    borderBottom: '1px solid #F1F5F9',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    backgroundColor: '#FAFBFC'
                }}>
                    <Maximize size={14} style={{ color: '#64748B' }} />
                    <span style={{ fontSize: '11px', fontWeight: '600', color: '#64748B' }}>캔버스 비율</span>
                    <select
                        value={canvasAspectRatio}
                        onChange={(e) => setCanvasAspectRatio(e.target.value)}
                        style={{
                            flex: 1,
                            padding: '6px 10px',
                            fontSize: '11px',
                            fontWeight: '500',
                            border: '1px solid #E2E8F0',
                            borderRadius: '6px',
                            backgroundColor: 'white',
                            color: '#1E293B',
                            cursor: 'pointer',
                            outline: 'none'
                        }}
                    >
                        <option value="1:1">1:1 정사각형</option>
                        <option value="4:5">4:5 인스타그램</option>
                        <option value="9:16">9:16 릴스/스토리</option>
                        <option value="16:9">16:9 유튜브</option>
                        <option value="3:4">3:4 세로형</option>
                    </select>
                </div>

                {activeObj ? (
                    <div style={{ flex: 1, padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        {/* Layer Order */}
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            backgroundColor: '#F8FAFC',
                            padding: '8px 12px',
                            borderRadius: '10px',
                            border: '1px solid #E2E8F0'
                        }}>
                            <span style={{ fontSize: '10px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase' }}>Layer Order</span>
                            <div style={{ display: 'flex', gap: '4px' }}>
                                {[
                                    { dir: 'back', Icon: ChevronsDown, title: '맨 뒤로' },
                                    { dir: 'backward', Icon: ArrowDown, title: '뒤로' },
                                    { dir: 'forward', Icon: ArrowUp, title: '앞으로' },
                                    { dir: 'front', Icon: ChevronsUp, title: '맨 앞으로' }
                                ].map(({ dir, Icon, title }) => (
                                    <button
                                        key={dir}
                                        onClick={() => moveLayer(dir)}
                                        title={title}
                                        style={{
                                            padding: '4px',
                                            backgroundColor: 'transparent',
                                            border: 'none',
                                            borderRadius: '4px',
                                            cursor: 'pointer'
                                        }}
                                        onMouseOver={e => e.currentTarget.style.backgroundColor = 'white'}
                                        onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}
                                    >
                                        <Icon size={14} color="#64748B" />
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Layout */}
                        <div>
                            <h3 style={{ fontSize: '11px', fontWeight: '700', color: '#64748B', marginBottom: '12px', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Layout size={12} /> Layout
                            </h3>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
                                {['x', 'y', 'width', 'height'].map(prop => (
                                    <div key={prop} style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        backgroundColor: '#F8FAFC',
                                        borderRadius: '8px',
                                        padding: '6px 10px',
                                        border: '1px solid #E2E8F0'
                                    }}>
                                        <span style={{ fontSize: '11px', color: '#94A3B8', fontWeight: '700', textTransform: 'uppercase', width: '14px' }}>
                                            {prop[0].toUpperCase()}
                                        </span>
                                        <input
                                            type="number"
                                            value={Math.round(activeObj[prop])}
                                            onChange={(e) => updateObjProp(selectedObjId, prop, Number(e.target.value))}
                                            style={{
                                                width: '100%',
                                                backgroundColor: 'transparent',
                                                border: 'none',
                                                fontSize: '13px',
                                                textAlign: 'right',
                                                outline: 'none'
                                            }}
                                        />
                                    </div>
                                ))}
                            </div>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                backgroundColor: '#F8FAFC',
                                padding: '10px 12px',
                                borderRadius: '10px',
                                border: '1px solid #E2E8F0'
                            }}>
                                <span style={{ fontSize: '12px', fontWeight: '500', color: '#475569', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <Maximize size={12} style={{ transform: 'rotate(45deg)' }} /> Radius
                                </span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '50%' }}>
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        value={activeObj.borderRadius || 0}
                                        onChange={(e) => updateObjProp(selectedObjId, 'borderRadius', Number(e.target.value))}
                                        style={{ flex: 1 }}
                                    />
                                    <span style={{ fontSize: '11px', color: '#94A3B8', width: '24px', textAlign: 'right' }}>{activeObj.borderRadius}</span>
                                </div>
                            </div>
                        </div>

                        {/* Free Transform Controls - shown when transformingObjId matches */}
                        {transformingObjId === selectedObjId && activeObj.type !== 'text' && (
                            <div style={{
                                borderTop: '1px solid #F1F5F9',
                                paddingTop: '16px',
                                backgroundColor: '#FDF2F8',
                                margin: '-20px -20px 0 -20px',
                                padding: '16px 20px',
                                borderRadius: '0'
                            }}>
                                <h3 style={{
                                    fontSize: '11px',
                                    fontWeight: '700',
                                    color: '#BE185D',
                                    marginBottom: '12px',
                                    textTransform: 'uppercase',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px'
                                }}>
                                    <Sparkles size={12} /> 자유 변형 모드
                                </h3>
                                <div style={{ fontSize: '10px', color: '#9D174D', marginBottom: '12px' }}>
                                    ESC를 눌러 종료 | 슬라이더로 기울기 조절
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span style={{ fontSize: '11px', fontWeight: '600', color: '#BE185D', width: '60px' }}>X축 기울기</span>
                                        <input
                                            type="range"
                                            min="-45"
                                            max="45"
                                            value={activeObj.skewX || 0}
                                            onChange={(e) => updateObjProp(selectedObjId, 'skewX', Number(e.target.value))}
                                            style={{ flex: 1 }}
                                        />
                                        <span style={{ fontSize: '11px', color: '#9D174D', width: '36px', textAlign: 'right' }}>
                                            {activeObj.skewX || 0}°
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span style={{ fontSize: '11px', fontWeight: '600', color: '#BE185D', width: '60px' }}>Y축 기울기</span>
                                        <input
                                            type="range"
                                            min="-45"
                                            max="45"
                                            value={activeObj.skewY || 0}
                                            onChange={(e) => updateObjProp(selectedObjId, 'skewY', Number(e.target.value))}
                                            style={{ flex: 1 }}
                                        />
                                        <span style={{ fontSize: '11px', color: '#9D174D', width: '36px', textAlign: 'right' }}>
                                            {activeObj.skewY || 0}°
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => {
                                            updateObjMultiProp(selectedObjId, { skewX: 0, skewY: 0 });
                                        }}
                                        style={{
                                            padding: '8px 12px',
                                            fontSize: '11px',
                                            fontWeight: '600',
                                            backgroundColor: 'white',
                                            border: '1px solid #FBCFE8',
                                            borderRadius: '6px',
                                            color: '#BE185D',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        기울기 초기화
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Fill */}
                        <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: '16px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                <h3 style={{ fontSize: '11px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <Droplet size={12} /> Fill
                                </h3>
                                <div style={{ display: 'flex', backgroundColor: '#F1F5F9', borderRadius: '6px', padding: '2px' }}>
                                    <button
                                        onClick={() => updateObjProp(selectedObjId, 'isGradient', false)}
                                        style={{
                                            padding: '4px 10px',
                                            fontSize: '10px',
                                            fontWeight: activeObj.isGradient ? '400' : '600',
                                            backgroundColor: activeObj.isGradient ? 'transparent' : 'white',
                                            color: activeObj.isGradient ? '#94A3B8' : '#1E293B',
                                            border: 'none',
                                            borderRadius: '4px',
                                            cursor: 'pointer',
                                            boxShadow: activeObj.isGradient ? 'none' : '0 1px 2px rgba(0,0,0,0.05)'
                                        }}
                                    >
                                        Solid
                                    </button>
                                    <button
                                        onClick={() => {
                                            // Set both isGradient and gradientStops atomically to avoid race condition
                                            const updates = { isGradient: true };
                                            if (!activeObj.gradientStops || activeObj.gradientStops.length < 2) {
                                                updates.gradientStops = [
                                                    { position: 0, color: '#FF007A', alpha: 1 },
                                                    { position: 100, color: '#6366F1', alpha: 1 }
                                                ];
                                            }
                                            if (!activeObj.gradientAngle) {
                                                updates.gradientAngle = 180;
                                            }
                                            updateObjMultiProp(selectedObjId, updates);
                                            setSelectedGradientStop(0);
                                        }}
                                        style={{
                                            padding: '4px 10px',
                                            fontSize: '10px',
                                            fontWeight: activeObj.isGradient ? '600' : '400',
                                            backgroundColor: activeObj.isGradient ? 'white' : 'transparent',
                                            color: activeObj.isGradient ? '#1E293B' : '#94A3B8',
                                            border: 'none',
                                            borderRadius: '4px',
                                            cursor: 'pointer',
                                            boxShadow: activeObj.isGradient ? '0 1px 2px rgba(0,0,0,0.05)' : 'none'
                                        }}
                                    >
                                        Gradient
                                    </button>
                                </div>
                            </div>

                            {(() => {
                                // Wrap entire gradient UI in try-catch to prevent crashes
                                try {
                                    if (activeObj.isGradient && activeObj.gradientStops && activeObj.gradientStops.length >= 2) {
                                        return (
                                            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                                <div style={{
                                                    backgroundColor: '#F8FAFC',
                                                    padding: '12px',
                                                    borderRadius: '12px',
                                                    border: '1px solid #E2E8F0'
                                                }}>
                                                    {/* Gradient Angle Control */}
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                                                        <span style={{ fontSize: '10px', color: '#94A3B8', fontWeight: '600' }}>각도</span>
                                                        <input
                                                            type="range"
                                                            min="0"
                                                            max="360"
                                                            value={activeObj.gradientAngle || 180}
                                                            onChange={(e) => updateObjProp(selectedObjId, 'gradientAngle', Number(e.target.value))}
                                                            style={{ flex: 1 }}
                                                        />
                                                        <span style={{ fontSize: '10px', color: '#64748B', width: '36px', textAlign: 'right' }}>
                                                            {activeObj.gradientAngle || 180}°
                                                        </span>
                                                    </div>

                                                    {/* Gradient Slider Bar */}
                                                    <div
                                                        ref={gradientBarRef}
                                                        onClick={(e) => {
                                                            if (draggingStopIndex !== null) return;
                                                            const rect = e.currentTarget.getBoundingClientRect();
                                                            const x = e.clientX - rect.left;
                                                            const position = Math.round((x / rect.width) * 100);
                                                            if (position > 0 && position < 100) {
                                                                addGradientStop(selectedObjId, position);
                                                            }
                                                        }}
                                                        style={{
                                                            position: 'relative',
                                                            height: '28px',
                                                            borderRadius: '14px',
                                                            marginBottom: '12px',
                                                            background: (() => {
                                                                try {
                                                                    const gradientCSS = getGradientCSS(activeObj);
                                                                    if (typeof gradientCSS === 'string') {
                                                                        return gradientCSS.replace(/\d+deg/, '90deg');
                                                                    }
                                                                    return 'linear-gradient(90deg, #FF007A 0%, #6366F1 100%)';
                                                                } catch {
                                                                    return 'linear-gradient(90deg, #FF007A 0%, #6366F1 100%)';
                                                                }
                                                            })(),
                                                            cursor: 'crosshair',
                                                            border: '1px solid #E2E8F0'
                                                        }}
                                                    >
                                                        {(activeObj.gradientStops || []).map((stop, index) => {
                                                            // Safely get stop properties with defaults
                                                            const stopPosition = (stop && typeof stop.position === 'number') ? stop.position : 0;
                                                            const stopColor = (stop && stop.color) ? stop.color : '#808080';

                                                            return (
                                                                <div
                                                                    key={index}
                                                                    onMouseDown={(e) => {
                                                                        e.stopPropagation();
                                                                        setDraggingStopIndex(index);
                                                                        setSelectedGradientStop(index);
                                                                    }}
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setSelectedGradientStop(index);
                                                                    }}
                                                                    onDoubleClick={(e) => {
                                                                        e.stopPropagation();
                                                                        if ((activeObj.gradientStops || []).length > 2) {
                                                                            removeGradientStop(selectedObjId, index);
                                                                        }
                                                                    }}
                                                                    style={{
                                                                        position: 'absolute',
                                                                        left: `calc(${stopPosition}% - 12px)`,
                                                                        top: '50%',
                                                                        transform: 'translateY(-50%)',
                                                                        width: '24px',
                                                                        height: '24px',
                                                                        borderRadius: '50%',
                                                                        backgroundColor: stopColor,
                                                                        border: selectedGradientStop === index ? '3px solid #3B82F6' : '2px solid white',
                                                                        cursor: 'grab',
                                                                        boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
                                                                        zIndex: selectedGradientStop === index ? 10 : 1,
                                                                        transition: draggingStopIndex === index ? 'none' : 'border 0.15s'
                                                                    }}
                                                                    title={`위치: ${stopPosition}% | 더블클릭으로 삭제`}
                                                                />
                                                            );
                                                        })}
                                                    </div>

                                                    {/* Selected Stop Controls */}
                                                    {(() => {
                                                        const currentStop = activeObj.gradientStops && activeObj.gradientStops[selectedGradientStop];
                                                        if (!currentStop) return null;

                                                        const stopColor = currentStop.color || '#808080';
                                                        const stopPosition = typeof currentStop.position === 'number' ? currentStop.position : 0;
                                                        const stopAlpha = typeof currentStop.alpha === 'number' ? currentStop.alpha : 1;

                                                        return (
                                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                    <span style={{ fontSize: '10px', fontWeight: '600', color: '#475569', width: '44px' }}>색상</span>
                                                                    <div style={{
                                                                        flex: 1,
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        gap: '8px',
                                                                        backgroundColor: 'white',
                                                                        border: '1px solid #E2E8F0',
                                                                        borderRadius: '8px',
                                                                        padding: '6px'
                                                                    }}>
                                                                        <input
                                                                            type="color"
                                                                            value={stopColor}
                                                                            onChange={(e) => updateGradientStop(selectedObjId, selectedGradientStop, { color: e.target.value })}
                                                                            style={{ width: '24px', height: '24px', borderRadius: '4px', border: 'none', cursor: 'pointer', backgroundColor: 'transparent' }}
                                                                        />
                                                                        <span style={{ fontSize: '10px', color: '#64748B', fontFamily: 'monospace', textTransform: 'uppercase', flex: 1 }}>
                                                                            {stopColor}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                    <span style={{ fontSize: '10px', fontWeight: '600', color: '#475569', width: '44px' }}>위치</span>
                                                                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                        <input
                                                                            type="range"
                                                                            min="0"
                                                                            max="100"
                                                                            value={stopPosition}
                                                                            onChange={(e) => {
                                                                                updateGradientStop(selectedObjId, selectedGradientStop, { position: Number(e.target.value) });
                                                                            }}
                                                                            style={{ flex: 1 }}
                                                                        />
                                                                        <span style={{ fontSize: '10px', color: '#94A3B8', width: '32px', textAlign: 'right' }}>
                                                                            {stopPosition}%
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                    <span style={{ fontSize: '10px', fontWeight: '600', color: '#475569', width: '44px' }}>투명</span>
                                                                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                        <input
                                                                            type="range"
                                                                            min="0"
                                                                            max="1"
                                                                            step="0.01"
                                                                            value={stopAlpha}
                                                                            onChange={(e) => updateGradientStop(selectedObjId, selectedGradientStop, { alpha: Number(e.target.value) })}
                                                                            style={{ flex: 1 }}
                                                                        />
                                                                        <span style={{ fontSize: '10px', color: '#94A3B8', width: '32px', textAlign: 'right' }}>
                                                                            {Math.round(stopAlpha * 100)}%
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                                {/* 스탑 삭제 버튼 */}
                                                                {(activeObj.gradientStops || []).length > 2 && (
                                                                    <button
                                                                        onClick={() => {
                                                                            removeGradientStop(selectedObjId, selectedGradientStop);
                                                                            setSelectedGradientStop(Math.max(0, selectedGradientStop - 1));
                                                                        }}
                                                                        style={{
                                                                            marginTop: '4px',
                                                                            padding: '8px 12px',
                                                                            fontSize: '11px',
                                                                            fontWeight: '600',
                                                                            backgroundColor: '#FEF2F2',
                                                                            color: '#EF4444',
                                                                            border: '1px solid #FECACA',
                                                                            borderRadius: '6px',
                                                                            cursor: 'pointer',
                                                                            display: 'flex',
                                                                            alignItems: 'center',
                                                                            justifyContent: 'center',
                                                                            gap: '4px'
                                                                        }}
                                                                    >
                                                                        <X size={12} /> 이 스탑 삭제
                                                                    </button>
                                                                )}
                                                            </div>
                                                        );
                                                    })()}
                                                </div>
                                                <div style={{ fontSize: '10px', color: '#94A3B8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <MousePointer2 size={10} /> 바 클릭으로 새 스탑 추가 | 더블클릭으로 삭제
                                                </div>
                                            </div>
                                        );
                                    }
                                    // else - show solid color picker
                                    return (
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '12px',
                                            backgroundColor: '#F8FAFC',
                                            padding: '10px',
                                            borderRadius: '12px',
                                            border: '1px solid #E2E8F0'
                                        }}>
                                            <input
                                                type="color"
                                                value={activeObj.color || '#000000'}
                                                onChange={(e) => updateObjProp(selectedObjId, 'color', e.target.value)}
                                                style={{ width: '40px', height: '40px', borderRadius: '8px', border: 'none', cursor: 'pointer', backgroundColor: 'transparent' }}
                                            />
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontSize: '10px', color: '#94A3B8', fontWeight: '600', marginBottom: '2px' }}>HEX CODE</div>
                                                <input
                                                    type="text"
                                                    value={activeObj.color || '#000000'}
                                                    onChange={(e) => updateObjProp(selectedObjId, 'color', e.target.value)}
                                                    style={{
                                                        width: '100%',
                                                        backgroundColor: 'transparent',
                                                        border: 'none',
                                                        fontSize: '13px',
                                                        fontFamily: 'monospace',
                                                        textTransform: 'uppercase',
                                                        fontWeight: '600',
                                                        outline: 'none'
                                                    }}
                                                />
                                            </div>
                                            <div style={{ borderLeft: '1px solid #E2E8F0', paddingLeft: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', width: '60px' }}>
                                                <span style={{ fontSize: '8px', color: '#94A3B8', textTransform: 'uppercase' }}>Alpha</span>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max="100"
                                                    value={Math.round((activeObj.opacity || 1) * 100)}
                                                    onChange={(e) => updateObjProp(selectedObjId, 'opacity', e.target.value / 100)}
                                                    style={{
                                                        width: '100%',
                                                        textAlign: 'center',
                                                        fontSize: '12px',
                                                        backgroundColor: 'transparent',
                                                        border: 'none',
                                                        fontWeight: '600',
                                                        outline: 'none'
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    );
                                } catch (err) {
                                    console.error('Gradient UI render error:', err);
                                    return (
                                        <div style={{ padding: '12px', backgroundColor: '#FEF2F2', borderRadius: '8px', color: '#991B1B', fontSize: '12px' }}>
                                            그라데이션 UI 로드 오류. Solid 모드를 사용해주세요.
                                        </div>
                                    );
                                }
                            })()}
                        </div>

                        {/* Stroke */}
                        <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: '16px' }}>
                            <h3 style={{ fontSize: '11px', fontWeight: '700', color: '#64748B', marginBottom: '12px', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <BoxSelect size={12} /> Stroke
                            </h3>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                backgroundColor: '#F8FAFC',
                                border: '1px solid #E2E8F0',
                                borderRadius: '8px',
                                padding: '10px'
                            }}>
                                <input
                                    type="color"
                                    value={activeObj.strokeColor}
                                    onChange={(e) => updateObjProp(selectedObjId, 'strokeColor', e.target.value)}
                                    style={{ width: '28px', height: '28px', borderRadius: '4px', border: 'none', cursor: 'pointer', backgroundColor: 'transparent' }}
                                />
                                <div style={{ flex: 1 }}>
                                    <span style={{ fontSize: '10px', color: '#94A3B8' }}>Width</span>
                                </div>
                                <input
                                    type="number"
                                    min="0"
                                    value={activeObj.strokeWidth}
                                    onChange={(e) => updateObjProp(selectedObjId, 'strokeWidth', Number(e.target.value))}
                                    style={{ width: '48px', backgroundColor: 'white', border: '1px solid #E2E8F0', borderRadius: '4px', fontSize: '12px', textAlign: 'center', padding: '4px', outline: 'none' }}
                                />
                                <span style={{ fontSize: '10px', color: '#94A3B8' }}>px</span>
                            </div>
                        </div>

                        {/* Effects Panel */}
                        <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: '16px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                <h3 style={{ fontSize: '11px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <Sparkles size={12} /> Effects
                                </h3>
                                <div style={{ display: 'flex', gap: '4px' }}>
                                    <button
                                        onClick={() => addEffect(selectedObjId, 'dropShadow')}
                                        style={{
                                            padding: '4px 8px',
                                            fontSize: '9px',
                                            fontWeight: '600',
                                            backgroundColor: '#DBEAFE',
                                            color: '#3B82F6',
                                            border: 'none',
                                            borderRadius: '4px',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '3px'
                                        }}
                                    >
                                        <Plus size={10} /> Shadow
                                    </button>
                                    <button
                                        onClick={() => addEffect(selectedObjId, 'layerBlur')}
                                        style={{
                                            padding: '4px 8px',
                                            fontSize: '9px',
                                            fontWeight: '600',
                                            backgroundColor: '#FEF3C7',
                                            color: '#D97706',
                                            border: 'none',
                                            borderRadius: '4px',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '3px'
                                        }}
                                    >
                                        <Plus size={10} /> Blur
                                    </button>
                                </div>
                            </div>

                            {/* Effects List */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {(activeObj.effects || []).length === 0 ? (
                                    <div style={{
                                        padding: '16px',
                                        backgroundColor: '#F8FAFC',
                                        borderRadius: '8px',
                                        border: '1px dashed #E2E8F0',
                                        textAlign: 'center',
                                        color: '#94A3B8',
                                        fontSize: '11px'
                                    }}>
                                        효과가 없습니다. 위 버튼으로 추가하세요.
                                    </div>
                                ) : (
                                    (activeObj.effects || []).map((effect) => (
                                        <div
                                            key={effect.id}
                                            style={{
                                                backgroundColor: effect.enabled ? '#F8FAFC' : '#FAFAFA',
                                                border: '1px solid #E2E8F0',
                                                borderRadius: '10px',
                                                padding: '12px',
                                                opacity: effect.enabled ? 1 : 0.6
                                            }}
                                        >
                                            {/* Effect Header */}
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: effect.enabled ? '10px' : '0' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <button
                                                        onClick={() => toggleEffect(selectedObjId, effect.id)}
                                                        style={{
                                                            padding: '4px',
                                                            backgroundColor: 'transparent',
                                                            border: 'none',
                                                            cursor: 'pointer',
                                                            color: effect.enabled ? '#3B82F6' : '#CBD5E1'
                                                        }}
                                                    >
                                                        {effect.enabled ? <Eye size={14} /> : <EyeOff size={14} />}
                                                    </button>
                                                    <span style={{ fontSize: '11px', fontWeight: '600', color: '#475569' }}>
                                                        {effect.type === 'dropShadow' ? 'Drop Shadow' : 'Layer Blur'}
                                                    </span>
                                                </div>
                                                <button
                                                    onClick={() => removeEffect(selectedObjId, effect.id)}
                                                    style={{
                                                        padding: '4px',
                                                        backgroundColor: 'transparent',
                                                        border: 'none',
                                                        cursor: 'pointer',
                                                        color: '#EF4444'
                                                    }}
                                                >
                                                    <X size={14} />
                                                </button>
                                            </div>

                                            {/* Drop Shadow Controls */}
                                            {effect.type === 'dropShadow' && effect.enabled && (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                                                        {/* X Offset */}
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: 'white', borderRadius: '6px', padding: '6px 8px', border: '1px solid #E2E8F0' }}>
                                                            <span style={{ fontSize: '9px', color: '#94A3B8', width: '14px' }}>X</span>
                                                            <input
                                                                type="number"
                                                                value={effect.x}
                                                                onChange={(e) => updateEffect(selectedObjId, effect.id, { x: Number(e.target.value) })}
                                                                style={{ width: '100%', backgroundColor: 'transparent', border: 'none', fontSize: '11px', textAlign: 'right', outline: 'none' }}
                                                            />
                                                        </div>
                                                        {/* Y Offset */}
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: 'white', borderRadius: '6px', padding: '6px 8px', border: '1px solid #E2E8F0' }}>
                                                            <span style={{ fontSize: '9px', color: '#94A3B8', width: '14px' }}>Y</span>
                                                            <input
                                                                type="number"
                                                                value={effect.y}
                                                                onChange={(e) => updateEffect(selectedObjId, effect.id, { y: Number(e.target.value) })}
                                                                style={{ width: '100%', backgroundColor: 'transparent', border: 'none', fontSize: '11px', textAlign: 'right', outline: 'none' }}
                                                            />
                                                        </div>
                                                        {/* Blur */}
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: 'white', borderRadius: '6px', padding: '6px 8px', border: '1px solid #E2E8F0' }}>
                                                            <span style={{ fontSize: '9px', color: '#94A3B8', width: '24px' }}>Blur</span>
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                value={effect.blur}
                                                                onChange={(e) => updateEffect(selectedObjId, effect.id, { blur: Number(e.target.value) })}
                                                                style={{ width: '100%', backgroundColor: 'transparent', border: 'none', fontSize: '11px', textAlign: 'right', outline: 'none' }}
                                                            />
                                                        </div>
                                                        {/* Spread */}
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: 'white', borderRadius: '6px', padding: '6px 8px', border: '1px solid #E2E8F0' }}>
                                                            <span style={{ fontSize: '9px', color: '#94A3B8', width: '24px' }}>Sprd</span>
                                                            <input
                                                                type="number"
                                                                value={effect.spread}
                                                                onChange={(e) => updateEffect(selectedObjId, effect.id, { spread: Number(e.target.value) })}
                                                                style={{ width: '100%', backgroundColor: 'transparent', border: 'none', fontSize: '11px', textAlign: 'right', outline: 'none' }}
                                                            />
                                                        </div>
                                                    </div>
                                                    {/* Color & Opacity */}
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        <input
                                                            type="color"
                                                            value={effect.color}
                                                            onChange={(e) => updateEffect(selectedObjId, effect.id, { color: e.target.value })}
                                                            style={{ width: '28px', height: '28px', borderRadius: '4px', border: 'none', cursor: 'pointer', backgroundColor: 'transparent' }}
                                                        />
                                                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                            <span style={{ fontSize: '9px', color: '#94A3B8' }}>Opacity</span>
                                                            <input
                                                                type="range"
                                                                min="0"
                                                                max="1"
                                                                step="0.01"
                                                                value={effect.opacity}
                                                                onChange={(e) => updateEffect(selectedObjId, effect.id, { opacity: Number(e.target.value) })}
                                                                style={{ flex: 1 }}
                                                            />
                                                            <span style={{ fontSize: '9px', color: '#64748B', width: '28px' }}>
                                                                {Math.round(effect.opacity * 100)}%
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Layer Blur Controls */}
                                            {effect.type === 'layerBlur' && effect.enabled && (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <span style={{ fontSize: '10px', color: '#94A3B8' }}>Blur</span>
                                                    <input
                                                        type="range"
                                                        min="0"
                                                        max="50"
                                                        value={effect.blur}
                                                        onChange={(e) => updateEffect(selectedObjId, effect.id, { blur: Number(e.target.value) })}
                                                        style={{ flex: 1 }}
                                                    />
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        value={effect.blur}
                                                        onChange={(e) => updateEffect(selectedObjId, effect.id, { blur: Number(e.target.value) })}
                                                        style={{
                                                            width: '48px',
                                                            backgroundColor: 'white',
                                                            border: '1px solid #E2E8F0',
                                                            borderRadius: '4px',
                                                            fontSize: '11px',
                                                            textAlign: 'center',
                                                            padding: '4px',
                                                            outline: 'none'
                                                        }}
                                                    />
                                                    <span style={{ fontSize: '9px', color: '#94A3B8' }}>px</span>
                                                </div>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Text Typography */}
                        {activeObj.type === 'text' && (
                            <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: '16px' }}>
                                <h3 style={{ fontSize: '11px', fontWeight: '700', color: '#64748B', marginBottom: '12px', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <Type size={12} /> Typography
                                </h3>

                                {/* Text Content */}
                                <textarea
                                    value={activeObj.text}
                                    onChange={(e) => updateObjProp(selectedObjId, 'text', e.target.value)}
                                    placeholder="텍스트를 입력하세요 (줄바꿈 가능)"
                                    style={{
                                        width: '100%',
                                        padding: '12px',
                                        border: '1px solid #E2E8F0',
                                        borderRadius: '10px',
                                        marginBottom: '12px',
                                        fontSize: '14px',
                                        resize: 'vertical',
                                        outline: 'none',
                                        backgroundColor: '#F8FAFC',
                                        minHeight: '60px',
                                        fontFamily: 'inherit',
                                        lineHeight: '1.5'
                                    }}
                                    rows={3}
                                />

                                {/* Font Family */}
                                <div style={{ marginBottom: '12px' }}>
                                    <label style={{ fontSize: '10px', color: '#94A3B8', fontWeight: '600', display: 'block', marginBottom: '6px' }}>글꼴</label>
                                    <select
                                        value={activeObj.fontFamily || 'sans-serif'}
                                        onChange={(e) => updateObjProp(selectedObjId, 'fontFamily', e.target.value)}
                                        style={{
                                            width: '100%',
                                            padding: '10px 12px',
                                            border: '1px solid #E2E8F0',
                                            borderRadius: '8px',
                                            fontSize: '13px',
                                            backgroundColor: '#F8FAFC',
                                            cursor: 'pointer',
                                            outline: 'none'
                                        }}
                                    >
                                        {FONT_OPTIONS.map(font => (
                                            <option key={font.value} value={font.value} style={{ fontFamily: font.value }}>
                                                {font.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Font Weight */}
                                <div style={{ marginBottom: '12px' }}>
                                    <label style={{ fontSize: '10px', color: '#94A3B8', fontWeight: '600', display: 'block', marginBottom: '6px' }}>
                                        <Bold size={10} style={{ marginRight: '4px' }} />두께
                                    </label>
                                    <div style={{ display: 'flex', gap: '4px', backgroundColor: '#F8FAFC', borderRadius: '8px', padding: '4px', border: '1px solid #E2E8F0' }}>
                                        {FONT_WEIGHTS.map(weight => (
                                            <button
                                                key={weight.value}
                                                onClick={() => updateObjProp(selectedObjId, 'fontWeight', weight.value)}
                                                style={{
                                                    flex: 1,
                                                    padding: '6px 4px',
                                                    fontSize: '10px',
                                                    fontWeight: weight.value,
                                                    borderRadius: '6px',
                                                    border: 'none',
                                                    backgroundColor: activeObj.fontWeight === weight.value ? 'white' : 'transparent',
                                                    color: activeObj.fontWeight === weight.value ? '#FF007A' : '#64748B',
                                                    cursor: 'pointer',
                                                    boxShadow: activeObj.fontWeight === weight.value ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
                                                    transition: 'all 0.15s'
                                                }}
                                            >
                                                {weight.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Font Size and Alignment */}
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0', padding: '4px 8px' }}>
                                        <span style={{ fontSize: '10px', color: '#94A3B8' }}>크기</span>
                                        <input
                                            type="number"
                                            value={activeObj.fontSize}
                                            onChange={(e) => updateObjProp(selectedObjId, 'fontSize', Number(e.target.value))}
                                            style={{
                                                width: '50px',
                                                textAlign: 'center',
                                                border: 'none',
                                                backgroundColor: 'transparent',
                                                fontSize: '13px',
                                                fontWeight: '600',
                                                outline: 'none'
                                            }}
                                        />
                                    </div>
                                    <div style={{
                                        flex: 1,
                                        display: 'flex',
                                        backgroundColor: '#F8FAFC',
                                        borderRadius: '8px',
                                        border: '1px solid #E2E8F0',
                                        padding: '2px'
                                    }}>
                                        {['left', 'center', 'right'].map(align => (
                                            <button
                                                key={align}
                                                onClick={() => updateObjProp(selectedObjId, 'textAlign', align)}
                                                style={{
                                                    flex: 1,
                                                    display: 'flex',
                                                    justifyContent: 'center',
                                                    alignItems: 'center',
                                                    padding: '8px',
                                                    borderRadius: '6px',
                                                    border: 'none',
                                                    backgroundColor: activeObj.textAlign === align ? 'white' : 'transparent',
                                                    color: activeObj.textAlign === align ? '#FF007A' : '#94A3B8',
                                                    cursor: 'pointer',
                                                    boxShadow: activeObj.textAlign === align ? '0 1px 2px rgba(0,0,0,0.05)' : 'none'
                                                }}
                                            >
                                                {align === 'left' ? <AlignLeft size={14} /> : align === 'center' ? <AlignCenter size={14} /> : <AlignRight size={14} />}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Letter Spacing (자간) and Line Height (행간) */}
                                <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                                    <div style={{
                                        flex: 1,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '6px',
                                        backgroundColor: '#F8FAFC',
                                        borderRadius: '8px',
                                        border: '1px solid #E2E8F0',
                                        padding: '8px'
                                    }}>
                                        <span style={{ fontSize: '10px', color: '#94A3B8', fontWeight: '600' }}>자간</span>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <input
                                                type="range"
                                                min="-5"
                                                max="20"
                                                step="0.5"
                                                value={activeObj.letterSpacing || 0}
                                                onChange={(e) => updateObjProp(selectedObjId, 'letterSpacing', Number(e.target.value))}
                                                style={{ flex: 1 }}
                                            />
                                            <span style={{ fontSize: '10px', color: '#64748B', width: '32px', textAlign: 'right' }}>
                                                {activeObj.letterSpacing || 0}px
                                            </span>
                                        </div>
                                    </div>
                                    <div style={{
                                        flex: 1,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '6px',
                                        backgroundColor: '#F8FAFC',
                                        borderRadius: '8px',
                                        border: '1px solid #E2E8F0',
                                        padding: '8px'
                                    }}>
                                        <span style={{ fontSize: '10px', color: '#94A3B8', fontWeight: '600' }}>행간</span>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <input
                                                type="range"
                                                min="0.8"
                                                max="3"
                                                step="0.1"
                                                value={activeObj.lineHeight || 1.4}
                                                onChange={(e) => updateObjProp(selectedObjId, 'lineHeight', Number(e.target.value))}
                                                style={{ flex: 1 }}
                                            />
                                            <span style={{ fontSize: '10px', color: '#64748B', width: '32px', textAlign: 'right' }}>
                                                {(activeObj.lineHeight || 1.4).toFixed(1)}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div style={{ marginTop: '12px', fontSize: '10px', color: '#94A3B8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <MousePointer2 size={10} /> 캔버스에서 텍스트를 더블클릭하여 직접 편집
                                </div>
                            </div>
                        )}

                        {/* Delete Button */}
                        <div style={{ marginTop: 'auto', paddingTop: '16px' }}>
                            <button
                                onClick={() => {
                                    setCanvasObjects(canvasObjects.filter(o => o.id !== selectedObjId));
                                    setSelectedObjId(null);
                                }}
                                style={{
                                    width: '100%',
                                    padding: '14px',
                                    color: '#EF4444',
                                    backgroundColor: 'white',
                                    border: '1px solid #FEE2E2',
                                    borderRadius: '12px',
                                    fontSize: '13px',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px'
                                }}
                                onMouseOver={e => e.currentTarget.style.backgroundColor = '#FEF2F2'}
                                onMouseOut={e => e.currentTarget.style.backgroundColor = 'white'}
                            >
                                <Trash2 size={14} /> 레이어 삭제
                            </button>
                        </div>
                    </div>
                ) : (
                    <div style={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#94A3B8',
                        padding: '32px',
                        textAlign: 'center',
                        backgroundColor: '#FAFAFA'
                    }}>
                        <Layers size={40} style={{ marginBottom: '16px', opacity: 0.3 }} />
                        <p style={{ fontSize: '13px', fontWeight: '500' }}>편집할 요소를 선택해주세요</p>
                    </div>
                )}
            </div>

            {/* Canvas Area */}
            <div
                style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#E2E8F0',
                    position: 'relative',
                    overflow: 'hidden'
                }}
                onMouseDown={() => setSelectedObjId(null)}
            >
                {/* Export Button */}
                <button
                    onClick={downloadCompositeImage}
                    style={{
                        position: 'absolute',
                        top: '16px',
                        right: '16px',
                        backgroundColor: '#1E293B',
                        color: 'white',
                        padding: '10px 16px',
                        borderRadius: '10px',
                        fontSize: '12px',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        border: 'none',
                        cursor: 'pointer',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                        zIndex: 100
                    }}
                >
                    <Download size={14} /> 내보내기
                </button>

                {/* Canvas */}
                <div
                    id="design-canvas"
                    style={{
                        position: 'relative',
                        width: `${canvasDims.width}px`,
                        height: `${canvasDims.height}px`,
                        backgroundColor: 'white',
                        boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
                        userSelect: 'none',
                        transition: 'width 0.3s ease, height 0.3s ease'
                    }}
                >
                    {/* White frame background - images are rendered as layers */}
                    {canvasObjects.length === 0 && (
                        <div style={{
                            width: '100%',
                            height: '100%',
                            backgroundColor: '#F8FAFC',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#CBD5E1',
                            fontSize: '14px'
                        }}>
                            먼저 이미지를 생성하세요
                        </div>
                    )}

                    {/* Smart Guide Lines */}
                    {((isDragging || isResizing) && guides.vertical.length > 0) && guides.vertical.map((x, i) => (
                        <div
                            key={`guide-v-${i}`}
                            style={{
                                position: 'absolute',
                                left: `${x}px`,
                                top: 0,
                                width: '2px',
                                height: '100%',
                                backgroundColor: '#18A0FB',
                                pointerEvents: 'none',
                                zIndex: 9999,
                                boxShadow: '0 0 4px rgba(24, 160, 251, 0.6)'
                            }}
                        />
                    ))}
                    {((isDragging || isResizing) && guides.horizontal.length > 0) && guides.horizontal.map((y, i) => (
                        <div
                            key={`guide-h-${i}`}
                            style={{
                                position: 'absolute',
                                left: 0,
                                top: `${y}px`,
                                width: '100%',
                                height: '2px',
                                backgroundColor: '#18A0FB',
                                pointerEvents: 'none',
                                zIndex: 9999,
                                boxShadow: '0 0 4px rgba(24, 160, 251, 0.6)'
                            }}
                        />
                    ))}

                    {canvasObjects.map(obj => {
                        // Use new gradient and effects system
                        const bgStyle = obj.isGradient ? getGradientCSS(obj) : obj.color;
                        const effectStyles = getEffectStyles(obj);

                        return (
                            <div
                                key={obj.id}
                                id={`obj-${obj.id}`}
                                onMouseDown={(e) => {
                                    if (editingTextId !== obj.id) {
                                        handleMouseDown(e, obj.id);
                                    }
                                }}
                                onDoubleClick={(e) => {
                                    e.stopPropagation();
                                    if (obj.type === 'text') {
                                        setEditingTextId(obj.id);
                                        setSelectedObjId(obj.id);
                                    } else if (obj.type === 'image') {
                                        // Enter image editing mode (crop/mask)
                                        setImageEditingId(imageEditingId === obj.id ? null : obj.id);
                                        setSelectedObjId(obj.id);
                                    } else {
                                        // Enable free transform mode for shapes
                                        setTransformingObjId(transformingObjId === obj.id ? null : obj.id);
                                        setSelectedObjId(obj.id);
                                    }
                                }}
                                style={{
                                    position: 'absolute',
                                    left: `${obj.x}px`,
                                    top: `${obj.y}px`,
                                    width: `${obj.width}px`,
                                    height: `${obj.height}px`,
                                    borderRadius: obj.type === 'circle' ? '50%' : `${obj.borderRadius || 0}px`,
                                    opacity: obj.opacity,
                                    background: obj.type === 'image' ? 'transparent' : (obj.type !== 'text' ? bgStyle : obj.bg),
                                    display: 'flex',
                                    alignItems: obj.type === 'text' ? 'flex-start' : 'center',
                                    justifyContent: obj.textAlign === 'center' ? 'center' : obj.textAlign === 'right' ? 'flex-end' : 'flex-start',
                                    padding: obj.type === 'text' ? '10px' : '0',
                                    zIndex: imageEditingId === obj.id ? 1000 : 10,
                                    outline: imageEditingId === obj.id ? '2px solid #10B981' : (transformingObjId === obj.id ? '2px dashed #FF007A' : (selectedObjId === obj.id ? '2px solid #3B82F6' : 'none')),
                                    border: obj.strokeWidth > 0 && obj.type !== 'text' && obj.type !== 'image' ? `${obj.strokeWidth}px solid ${obj.strokeColor}` : 'none',
                                    boxShadow: effectStyles.boxShadow,
                                    filter: effectStyles.filter,
                                    boxSizing: 'border-box',
                                    cursor: obj.type === 'text' && editingTextId === obj.id ? 'text' : (imageEditingId === obj.id ? 'grab' : 'move'),
                                    transform: `skew(${obj.skewX || 0}deg, ${obj.skewY || 0}deg)`,
                                    overflow: imageEditingId === obj.id ? 'visible' : (obj.type === 'image' ? 'hidden' : 'visible')
                                }}
                            >
                                {obj.type === 'text' && (
                                    editingTextId === obj.id ? (
                                        <textarea
                                            ref={textInputRef}
                                            autoFocus
                                            value={obj.text}
                                            onChange={(e) => updateObjProp(obj.id, 'text', e.target.value)}
                                            onBlur={() => setEditingTextId(null)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Escape') {
                                                    setEditingTextId(null);
                                                }
                                            }}
                                            style={{
                                                width: '100%',
                                                height: '100%',
                                                fontSize: `${obj.fontSize}px`,
                                                fontWeight: obj.fontWeight,
                                                fontFamily: obj.fontFamily || 'sans-serif',
                                                color: obj.isGradient ? 'transparent' : obj.color,
                                                backgroundImage: obj.isGradient ? bgStyle : 'none',
                                                WebkitBackgroundClip: obj.isGradient ? 'text' : 'border-box',
                                                textAlign: obj.textAlign,
                                                background: 'transparent',
                                                border: 'none',
                                                outline: 'none',
                                                resize: 'none',
                                                padding: 0,
                                                margin: 0,
                                                lineHeight: obj.lineHeight || 1.4,
                                                letterSpacing: `${obj.letterSpacing || 0}px`,
                                                overflow: 'hidden'
                                            }}
                                        />
                                    ) : (
                                        <span style={{
                                            fontSize: `${obj.fontSize}px`,
                                            fontWeight: obj.fontWeight,
                                            fontFamily: obj.fontFamily || 'sans-serif',
                                            color: obj.isGradient ? 'transparent' : obj.color,
                                            backgroundImage: obj.isGradient ? bgStyle : 'none',
                                            WebkitBackgroundClip: obj.isGradient ? 'text' : 'border-box',
                                            pointerEvents: 'none',
                                            width: '100%',
                                            textAlign: obj.textAlign,
                                            whiteSpace: 'pre-wrap',
                                            lineHeight: obj.lineHeight || 1.4,
                                            letterSpacing: `${obj.letterSpacing || 0}px`,
                                            wordBreak: 'break-word'
                                        }}>
                                            {obj.text}
                                        </span>
                                    )
                                )}

                                {/* Image rendering */}
                                {obj.type === 'image' && obj.src && (
                                    imageEditingId === obj.id ? (
                                        // Image editing mode - show full image with drag capability
                                        <div
                                            style={{
                                                position: 'absolute',
                                                top: 0,
                                                left: 0,
                                                width: '100%',
                                                height: '100%',
                                                overflow: 'visible',
                                                cursor: 'grab'
                                            }}
                                            onMouseDown={(e) => handleImageEditMouseDown(e, obj.id)}
                                        >
                                            {/* Semi-transparent overlay for outside area */}
                                            <div style={{
                                                position: 'absolute',
                                                top: `-${obj.height}px`,
                                                left: `-${obj.width}px`,
                                                width: `${obj.width * 3}px`,
                                                height: `${obj.height * 3}px`,
                                                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                                                pointerEvents: 'none',
                                                zIndex: -1
                                            }} />
                                            {/* Clear center area */}
                                            <div style={{
                                                position: 'absolute',
                                                top: 0,
                                                left: 0,
                                                width: '100%',
                                                height: '100%',
                                                backgroundColor: 'transparent',
                                                boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)',
                                                zIndex: 0,
                                                pointerEvents: 'none'
                                            }} />
                                            {/* The actual image that can be moved */}
                                            <img
                                                src={obj.src}
                                                alt="layer"
                                                style={{
                                                    position: 'absolute',
                                                    left: `${obj.imgX || 0}px`,
                                                    top: `${obj.imgY || 0}px`,
                                                    width: `${(obj.originalWidth || obj.width) * (obj.imgScale || 1)}px`,
                                                    height: `${(obj.originalHeight || obj.height) * (obj.imgScale || 1)}px`,
                                                    objectFit: 'contain',
                                                    pointerEvents: 'none',
                                                    zIndex: 1
                                                }}
                                                draggable={false}
                                            />
                                            {/* Scale control */}
                                            <div style={{
                                                position: 'absolute',
                                                bottom: '-40px',
                                                left: '50%',
                                                transform: 'translateX(-50%)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px',
                                                backgroundColor: 'white',
                                                padding: '6px 12px',
                                                borderRadius: '8px',
                                                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                                                zIndex: 100
                                            }}>
                                                <span style={{ fontSize: '11px', color: '#64748B' }}>크기</span>
                                                <input
                                                    type="range"
                                                    min="0.1"
                                                    max="3"
                                                    step="0.05"
                                                    value={obj.imgScale || 1}
                                                    onChange={(e) => handleImageScaleChange(obj.id, Number(e.target.value))}
                                                    style={{ width: '100px' }}
                                                    onMouseDown={(e) => e.stopPropagation()}
                                                />
                                                <span style={{ fontSize: '11px', color: '#64748B', width: '40px' }}>
                                                    {Math.round((obj.imgScale || 1) * 100)}%
                                                </span>
                                            </div>
                                        </div>
                                    ) : (
                                        // Normal display mode - clipped image
                                        <img
                                            src={obj.src}
                                            alt="layer"
                                            style={{
                                                position: 'absolute',
                                                left: `${obj.imgX || 0}px`,
                                                top: `${obj.imgY || 0}px`,
                                                width: obj.imgScale && obj.imgScale !== 1
                                                    ? `${(obj.originalWidth || obj.width) * obj.imgScale}px`
                                                    : '100%',
                                                height: obj.imgScale && obj.imgScale !== 1
                                                    ? `${(obj.originalHeight || obj.height) * obj.imgScale}px`
                                                    : '100%',
                                                objectFit: obj.imgScale && obj.imgScale !== 1 ? 'contain' : 'cover',
                                                pointerEvents: 'none'
                                            }}
                                            draggable={false}
                                        />
                                    )
                                )}

                                {/* Resize Handles */}
                                {selectedObjId === obj.id && !isGradHandleDragging && (
                                    <>
                                        {/* Corner handles */}
                                        {['nw', 'ne', 'sw', 'se'].map(handle => (
                                            <div
                                                key={handle}
                                                onMouseDown={(e) => handleResizeStart(e, obj.id, handle)}
                                                style={{
                                                    position: 'absolute',
                                                    width: '10px',
                                                    height: '10px',
                                                    backgroundColor: 'white',
                                                    border: '1px solid #3B82F6',
                                                    borderRadius: '50%',
                                                    cursor: `${handle}-resize`,
                                                    zIndex: 50,
                                                    ...(handle.includes('n') ? { top: '-5px' } : { bottom: '-5px' }),
                                                    ...(handle.includes('w') ? { left: '-5px' } : { right: '-5px' })
                                                }}
                                            />
                                        ))}
                                        {/* Side handles - North */}
                                        <div
                                            onMouseDown={(e) => handleResizeStart(e, obj.id, 'n')}
                                            style={{
                                                position: 'absolute',
                                                top: '-5px',
                                                left: '50%',
                                                transform: 'translateX(-50%)',
                                                width: '20px',
                                                height: '8px',
                                                backgroundColor: 'white',
                                                border: '1px solid #3B82F6',
                                                borderRadius: '4px',
                                                cursor: 'n-resize',
                                                zIndex: 50
                                            }}
                                        />
                                        {/* Side handles - South */}
                                        <div
                                            onMouseDown={(e) => handleResizeStart(e, obj.id, 's')}
                                            style={{
                                                position: 'absolute',
                                                bottom: '-5px',
                                                left: '50%',
                                                transform: 'translateX(-50%)',
                                                width: '20px',
                                                height: '8px',
                                                backgroundColor: 'white',
                                                border: '1px solid #3B82F6',
                                                borderRadius: '4px',
                                                cursor: 's-resize',
                                                zIndex: 50
                                            }}
                                        />
                                        {/* Side handles - West */}
                                        <div
                                            onMouseDown={(e) => handleResizeStart(e, obj.id, 'w')}
                                            style={{
                                                position: 'absolute',
                                                left: '-5px',
                                                top: '50%',
                                                transform: 'translateY(-50%)',
                                                width: '8px',
                                                height: '20px',
                                                backgroundColor: 'white',
                                                border: '1px solid #3B82F6',
                                                borderRadius: '4px',
                                                cursor: 'w-resize',
                                                zIndex: 50
                                            }}
                                        />
                                        {/* Side handles - East */}
                                        <div
                                            onMouseDown={(e) => handleResizeStart(e, obj.id, 'e')}
                                            style={{
                                                position: 'absolute',
                                                right: '-5px',
                                                top: '50%',
                                                transform: 'translateY(-50%)',
                                                width: '8px',
                                                height: '20px',
                                                backgroundColor: 'white',
                                                border: '1px solid #3B82F6',
                                                borderRadius: '4px',
                                                cursor: 'e-resize',
                                                zIndex: 50
                                            }}
                                        />
                                    </>
                                )}

                                {/* Gradient Handles */}
                                {selectedObjId === obj.id && obj.isGradient && obj.gradientCoords && (
                                    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 50 }}>
                                        <svg width="100%" height="100%" style={{ overflow: 'visible', pointerEvents: 'none' }}>
                                            <line
                                                x1={`${obj.gradientCoords.x1 * 100}%`}
                                                y1={`${obj.gradientCoords.y1 * 100}%`}
                                                x2={`${obj.gradientCoords.x2 * 100}%`}
                                                y2={`${obj.gradientCoords.y2 * 100}%`}
                                                stroke="white"
                                                strokeWidth="2"
                                                strokeDasharray="4"
                                                style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))' }}
                                            />
                                            <circle
                                                cx={`${obj.gradientCoords.x1 * 100}%`}
                                                cy={`${obj.gradientCoords.y1 * 100}%`}
                                                r="8"
                                                fill={obj.gradientStart}
                                                stroke="white"
                                                strokeWidth="2"
                                                style={{ cursor: 'move', pointerEvents: 'auto', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }}
                                                onMouseDown={(e) => handleGradHandleStart(e, obj.id, 'start')}
                                            />
                                            <circle
                                                cx={`${obj.gradientCoords.x2 * 100}%`}
                                                cy={`${obj.gradientCoords.y2 * 100}%`}
                                                r="8"
                                                fill={obj.gradientEnd}
                                                stroke="white"
                                                strokeWidth="2"
                                                style={{ cursor: 'move', pointerEvents: 'auto', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }}
                                                onMouseDown={(e) => handleGradHandleStart(e, obj.id, 'end')}
                                            />
                                        </svg>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div >
    );
}

// Wrap Studio in Error Boundary for export
const StudioWithErrorBoundary = (props) => (
    <StudioErrorBoundary>
        <Studio {...props} />
    </StudioErrorBoundary>
);

export default StudioWithErrorBoundary;
