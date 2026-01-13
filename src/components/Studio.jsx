import React, { useState } from 'react';
import {
    Type, Square, Circle, Layers, Layout, Droplet, BoxSelect,
    AlignLeft, AlignCenter, AlignRight, MousePointer2, Maximize,
    ArrowUp, ArrowDown, ChevronsUp, ChevronsDown, Trash2, Download
} from 'lucide-react';

function Studio({ canvasBg, setCanvasBg, canvasObjects, setCanvasObjects, onSave, topic }) {
    const [selectedObjId, setSelectedObjId] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isResizing, setIsResizing] = useState(false);
    const [isGradHandleDragging, setIsGradHandleDragging] = useState(false);
    const [resizeHandle, setResizeHandle] = useState(null);
    const [activeGradHandle, setActiveGradHandle] = useState(null);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [initialDims, setInitialDims] = useState({ x: 0, y: 0, width: 0, height: 0 });
    const [selectedGradientStop, setSelectedGradientStop] = useState(0);

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
        shadowBlur: 0,
        shadowColor: 'rgba(0,0,0,0.5)',
        isGradient: false,
        gradientStart: '#FF007A',
        gradientStartAlpha: 1,
        gradientEnd: '#6366F1',
        gradientEndAlpha: 1,
        gradientCoords: { x1: 0.5, y1: 0, x2: 0.5, y2: 1 },
        ...overrides
    });

    const addTextLayer = () => {
        const newObj = createBaseObject('text', {
            text: '텍스트 입력',
            x: 100, y: 150,
            width: 200, height: 50,
            bg: 'transparent',
            fontSize: 24,
            fontWeight: 'bold',
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

    const updateObjProp = (id, prop, value) => {
        setCanvasObjects(canvasObjects.map(obj =>
            obj.id === id ? { ...obj, [prop]: value } : obj
        ));
    };

    const updateGradCoord = (id, key, value) => {
        setCanvasObjects(canvasObjects.map(obj =>
            obj.id === id ? { ...obj, gradientCoords: { ...obj.gradientCoords, [key]: value } } : obj
        ));
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

    const handleMouseMove = (e) => {
        if (selectedObjId === null) return;
        const obj = canvasObjects.find(o => o.id === selectedObjId);
        if (!obj) return;

        if (isDragging) {
            const deltaX = e.clientX - dragStart.x;
            const deltaY = e.clientY - dragStart.y;
            setCanvasObjects(canvasObjects.map(o =>
                o.id === selectedObjId
                    ? { ...o, x: initialDims.x + deltaX, y: initialDims.y + deltaY }
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

            setCanvasObjects(canvasObjects.map(o =>
                o.id === selectedObjId ? { ...o, x: newX, y: newY, width: newW, height: newH } : o
            ));
        }
        else if (isGradHandleDragging) {
            const element = document.getElementById(`obj-${selectedObjId}`);
            if (element) {
                const rect = element.getBoundingClientRect();
                const mouseX = e.clientX - rect.left;
                const mouseY = e.clientY - rect.top;
                const relX = Math.min(1, Math.max(0, mouseX / rect.width));
                const relY = Math.min(1, Math.max(0, mouseY / rect.height));

                if (activeGradHandle === 'start') {
                    updateGradCoord(selectedObjId, 'x1', relX);
                    updateGradCoord(selectedObjId, 'y1', relY);
                } else {
                    updateGradCoord(selectedObjId, 'x2', relX);
                    updateGradCoord(selectedObjId, 'y2', relY);
                }
            }
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
        setIsResizing(false);
        setIsGradHandleDragging(false);
        setResizeHandle(null);
        setActiveGradHandle(null);
    };

    const downloadCompositeImage = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.src = canvasBg;

        img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            const scale = img.width / 400;

            canvasObjects.forEach(obj => {
                ctx.save();
                ctx.globalAlpha = obj.opacity;
                const x = obj.x * scale;
                const y = obj.y * scale;
                const w = obj.width * scale;
                const h = obj.height * scale;
                const radius = (obj.type === 'circle' ? Math.min(w, h) / 2 : obj.borderRadius) * scale;

                if (obj.shadowBlur > 0) {
                    ctx.shadowColor = obj.shadowColor;
                    ctx.shadowBlur = obj.shadowBlur * scale;
                    ctx.shadowOffsetX = 2 * scale;
                    ctx.shadowOffsetY = 2 * scale;
                }

                ctx.beginPath();
                if (obj.type === 'circle') ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, 2 * Math.PI);
                else ctx.roundRect(x, y, w, h, radius);
                ctx.closePath();

                let fillStyle = obj.color;
                if (obj.isGradient) {
                    const gx1 = x + obj.gradientCoords.x1 * w;
                    const gy1 = y + obj.gradientCoords.y1 * h;
                    const gx2 = x + obj.gradientCoords.x2 * w;
                    const gy2 = y + obj.gradientCoords.y2 * h;
                    const grad = ctx.createLinearGradient(gx1, gy1, gx2, gy2);

                    const hexToRgba = (hex, alpha) => {
                        const r = parseInt(hex.slice(1, 3), 16);
                        const g = parseInt(hex.slice(3, 5), 16);
                        const b = parseInt(hex.slice(5, 7), 16);
                        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
                    };
                    grad.addColorStop(0, hexToRgba(obj.gradientStart, obj.gradientStartAlpha));
                    grad.addColorStop(1, hexToRgba(obj.gradientEnd, obj.gradientEndAlpha));
                    fillStyle = grad;
                }

                if (obj.type !== 'text' || (obj.bg && obj.bg !== 'transparent')) {
                    ctx.fillStyle = obj.type === 'text' ? obj.bg : fillStyle;
                    ctx.fill();
                }

                if (obj.strokeWidth > 0) {
                    ctx.lineWidth = obj.strokeWidth * scale;
                    ctx.strokeStyle = obj.strokeColor;
                    ctx.stroke();
                }

                if (obj.type === 'text') {
                    ctx.shadowColor = 'transparent';
                    ctx.fillStyle = obj.isGradient ? fillStyle : obj.color;
                    ctx.font = `${obj.fontWeight} ${obj.fontSize * scale}px sans-serif`;
                    ctx.textAlign = obj.textAlign || 'left';
                    ctx.textBaseline = 'middle';
                    let textX = x;
                    if (obj.textAlign === 'center') textX = x + w / 2;
                    else if (obj.textAlign === 'right') textX = x + w - (10 * scale);
                    else textX = x + (10 * scale);
                    ctx.fillText(obj.text, textX, y + h / 2);
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
    };

    const activeObj = canvasObjects.find(t => t.id === selectedObjId);

    const getActiveStopColor = () => activeObj ? (selectedGradientStop === 0 ? activeObj.gradientStart : activeObj.gradientEnd) : '#000000';
    const setActiveStopColor = (val) => updateObjProp(selectedObjId, selectedGradientStop === 0 ? 'gradientStart' : 'gradientEnd', val);
    const getActiveStopAlpha = () => activeObj ? (selectedGradientStop === 0 ? activeObj.gradientStartAlpha : activeObj.gradientEndAlpha) : 1;
    const setActiveStopAlpha = (val) => updateObjProp(selectedObjId, selectedGradientStop === 0 ? 'gradientStartAlpha' : 'gradientEndAlpha', val);

    return (
        <div
            style={{ display: 'flex', height: '100%', overflow: 'hidden' }}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
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
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '8px',
                    position: 'sticky',
                    top: 0,
                    backgroundColor: 'white',
                    zIndex: 10
                }}>
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
                                        onClick={() => updateObjProp(selectedObjId, 'isGradient', true)}
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

                            {activeObj.isGradient ? (
                                <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    <div style={{
                                        backgroundColor: '#F8FAFC',
                                        padding: '12px',
                                        borderRadius: '12px',
                                        border: '1px solid #E2E8F0'
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#64748B', fontWeight: '600', marginBottom: '8px', textTransform: 'uppercase' }}>
                                            <button
                                                onClick={() => setSelectedGradientStop(0)}
                                                style={{
                                                    padding: '4px 8px',
                                                    borderRadius: '4px',
                                                    border: 'none',
                                                    backgroundColor: selectedGradientStop === 0 ? '#DBEAFE' : 'transparent',
                                                    color: selectedGradientStop === 0 ? '#3B82F6' : '#64748B',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                Start Point
                                            </button>
                                            <button
                                                onClick={() => setSelectedGradientStop(1)}
                                                style={{
                                                    padding: '4px 8px',
                                                    borderRadius: '4px',
                                                    border: 'none',
                                                    backgroundColor: selectedGradientStop === 1 ? '#DBEAFE' : 'transparent',
                                                    color: selectedGradientStop === 1 ? '#3B82F6' : '#64748B',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                End Point
                                            </button>
                                        </div>
                                        <div
                                            style={{
                                                position: 'relative',
                                                height: '24px',
                                                borderRadius: '12px',
                                                marginBottom: '16px',
                                                background: `linear-gradient(to right, ${activeObj.gradientStart}, ${activeObj.gradientEnd})`
                                            }}
                                        >
                                            <div
                                                onClick={() => setSelectedGradientStop(0)}
                                                style={{
                                                    position: 'absolute',
                                                    left: 0,
                                                    top: '50%',
                                                    transform: 'translateY(-50%)',
                                                    width: '24px',
                                                    height: '24px',
                                                    borderRadius: '50%',
                                                    backgroundColor: activeObj.gradientStart,
                                                    border: selectedGradientStop === 0 ? '2px solid #3B82F6' : '2px solid white',
                                                    cursor: 'pointer',
                                                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                                }}
                                            />
                                            <div
                                                onClick={() => setSelectedGradientStop(1)}
                                                style={{
                                                    position: 'absolute',
                                                    right: 0,
                                                    top: '50%',
                                                    transform: 'translateY(-50%)',
                                                    width: '24px',
                                                    height: '24px',
                                                    borderRadius: '50%',
                                                    backgroundColor: activeObj.gradientEnd,
                                                    border: selectedGradientStop === 1 ? '2px solid #3B82F6' : '2px solid white',
                                                    cursor: 'pointer',
                                                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                                }}
                                            />
                                        </div>

                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <span style={{ fontSize: '11px', fontWeight: '600', color: '#475569', width: '44px' }}>
                                                    {selectedGradientStop === 0 ? 'Start' : 'End'}
                                                </span>
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
                                                        value={getActiveStopColor()}
                                                        onChange={(e) => setActiveStopColor(e.target.value)}
                                                        style={{ width: '24px', height: '24px', borderRadius: '4px', border: 'none', cursor: 'pointer', backgroundColor: 'transparent' }}
                                                    />
                                                    <span style={{ fontSize: '10px', color: '#64748B', fontFamily: 'monospace', textTransform: 'uppercase', flex: 1 }}>
                                                        {getActiveStopColor()}
                                                    </span>
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <span style={{ fontSize: '11px', fontWeight: '600', color: '#475569', width: '44px' }}>Alpha</span>
                                                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <input
                                                        type="range"
                                                        min="0"
                                                        max="1"
                                                        step="0.01"
                                                        value={getActiveStopAlpha()}
                                                        onChange={(e) => setActiveStopAlpha(Number(e.target.value))}
                                                        style={{ flex: 1 }}
                                                    />
                                                    <span style={{ fontSize: '10px', color: '#94A3B8', width: '32px', textAlign: 'right' }}>
                                                        {Math.round(getActiveStopAlpha() * 100)}%
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ fontSize: '10px', color: '#94A3B8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <MousePointer2 size={10} /> 캔버스 위 핸들을 드래그하여 방향 조절
                                    </div>
                                </div>
                            ) : (
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
                                        value={activeObj.color}
                                        onChange={(e) => updateObjProp(selectedObjId, 'color', e.target.value)}
                                        style={{ width: '40px', height: '40px', borderRadius: '8px', border: 'none', cursor: 'pointer', backgroundColor: 'transparent' }}
                                    />
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: '10px', color: '#94A3B8', fontWeight: '600', marginBottom: '2px' }}>HEX CODE</div>
                                        <input
                                            type="text"
                                            value={activeObj.color}
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
                                            value={Math.round(activeObj.opacity * 100)}
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
                            )}
                        </div>

                        {/* Stroke & Shadow */}
                        <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: '16px' }}>
                            <h3 style={{ fontSize: '11px', fontWeight: '700', color: '#64748B', marginBottom: '12px', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <BoxSelect size={12} /> Stroke & Shadow
                            </h3>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    backgroundColor: '#F8FAFC',
                                    border: '1px solid #E2E8F0',
                                    borderRadius: '8px',
                                    padding: '8px'
                                }}>
                                    <span style={{ fontSize: '10px', color: '#94A3B8' }}>Border</span>
                                    <input
                                        type="color"
                                        value={activeObj.strokeColor}
                                        onChange={(e) => updateObjProp(selectedObjId, 'strokeColor', e.target.value)}
                                        style={{ width: '16px', height: '16px', borderRadius: '2px', border: 'none', cursor: 'pointer', backgroundColor: 'transparent' }}
                                    />
                                    <input
                                        type="number"
                                        value={activeObj.strokeWidth}
                                        onChange={(e) => updateObjProp(selectedObjId, 'strokeWidth', Number(e.target.value))}
                                        style={{ width: '32px', backgroundColor: 'transparent', border: 'none', fontSize: '12px', textAlign: 'right', outline: 'none' }}
                                    />
                                </div>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    backgroundColor: '#F8FAFC',
                                    border: '1px solid #E2E8F0',
                                    borderRadius: '8px',
                                    padding: '8px'
                                }}>
                                    <span style={{ fontSize: '10px', color: '#94A3B8' }}>Shadow</span>
                                    <input
                                        type="color"
                                        value={activeObj.shadowColor}
                                        onChange={(e) => updateObjProp(selectedObjId, 'shadowColor', e.target.value)}
                                        style={{ width: '16px', height: '16px', borderRadius: '2px', border: 'none', cursor: 'pointer', backgroundColor: 'transparent' }}
                                    />
                                    <input
                                        type="number"
                                        value={activeObj.shadowBlur}
                                        onChange={(e) => updateObjProp(selectedObjId, 'shadowBlur', Number(e.target.value))}
                                        style={{ width: '32px', backgroundColor: 'transparent', border: 'none', fontSize: '12px', textAlign: 'right', outline: 'none' }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Text Typography */}
                        {activeObj.type === 'text' && (
                            <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: '16px' }}>
                                <h3 style={{ fontSize: '11px', fontWeight: '700', color: '#64748B', marginBottom: '12px', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <Type size={12} /> Typography
                                </h3>
                                <textarea
                                    value={activeObj.text}
                                    onChange={(e) => updateObjProp(selectedObjId, 'text', e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '12px',
                                        border: '1px solid #E2E8F0',
                                        borderRadius: '10px',
                                        marginBottom: '12px',
                                        fontSize: '14px',
                                        resize: 'none',
                                        outline: 'none',
                                        backgroundColor: '#F8FAFC'
                                    }}
                                    rows={2}
                                />
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <input
                                        type="number"
                                        value={activeObj.fontSize}
                                        onChange={(e) => updateObjProp(selectedObjId, 'fontSize', Number(e.target.value))}
                                        style={{
                                            width: '60px',
                                            textAlign: 'center',
                                            border: '1px solid #E2E8F0',
                                            borderRadius: '8px',
                                            fontSize: '13px',
                                            padding: '8px'
                                        }}
                                    />
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
                        width: '400px',
                        height: '400px',
                        backgroundColor: 'white',
                        boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
                        userSelect: 'none'
                    }}
                >
                    {canvasBg ? (
                        <img src={canvasBg} alt="bg" style={{ width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none' }} />
                    ) : (
                        <div style={{ width: '100%', height: '100%', backgroundColor: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#CBD5E1', fontSize: '14px' }}>
                            먼저 이미지를 생성하세요
                        </div>
                    )}

                    {canvasObjects.map(obj => {
                        const isGrad = obj.isGradient;
                        const bgStyle = isGrad
                            ? `linear-gradient(${Math.atan2(obj.gradientCoords.y2 - obj.gradientCoords.y1, obj.gradientCoords.x2 - obj.gradientCoords.x1) * 180 / Math.PI + 90}deg, 
                 ${obj.gradientStart}${Math.round(obj.gradientStartAlpha * 255).toString(16).padStart(2, '0')}, 
                 ${obj.gradientEnd}${Math.round(obj.gradientEndAlpha * 255).toString(16).padStart(2, '0')})`
                            : obj.color;

                        return (
                            <div
                                key={obj.id}
                                id={`obj-${obj.id}`}
                                onMouseDown={(e) => handleMouseDown(e, obj.id)}
                                style={{
                                    position: 'absolute',
                                    left: `${obj.x}px`,
                                    top: `${obj.y}px`,
                                    width: `${obj.width}px`,
                                    height: `${obj.height}px`,
                                    borderRadius: obj.type === 'circle' ? '50%' : `${obj.borderRadius}px`,
                                    opacity: obj.opacity,
                                    background: obj.type !== 'text' ? bgStyle : obj.bg,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: obj.textAlign === 'center' ? 'center' : obj.textAlign === 'right' ? 'flex-end' : 'flex-start',
                                    padding: obj.type === 'text' ? '10px' : '0',
                                    zIndex: 10,
                                    outline: selectedObjId === obj.id ? '2px solid #3B82F6' : 'none',
                                    border: obj.strokeWidth > 0 && obj.type !== 'text' ? `${obj.strokeWidth}px solid ${obj.strokeColor}` : 'none',
                                    boxShadow: obj.shadowBlur > 0 ? `2px 2px ${obj.shadowBlur}px ${obj.shadowColor}` : 'none',
                                    boxSizing: 'border-box',
                                    cursor: 'move'
                                }}
                            >
                                {obj.type === 'text' && (
                                    <span style={{
                                        fontSize: `${obj.fontSize}px`,
                                        fontWeight: obj.fontWeight,
                                        color: obj.isGradient ? 'transparent' : obj.color,
                                        backgroundImage: obj.isGradient ? bgStyle : 'none',
                                        WebkitBackgroundClip: obj.isGradient ? 'text' : 'border-box',
                                        pointerEvents: 'none',
                                        width: '100%',
                                        textAlign: obj.textAlign
                                    }}>
                                        {obj.text}
                                    </span>
                                )}

                                {/* Resize Handles */}
                                {selectedObjId === obj.id && !isGradHandleDragging && (
                                    <>
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
                                    </>
                                )}

                                {/* Gradient Handles */}
                                {selectedObjId === obj.id && obj.isGradient && (
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
        </div>
    );
}

export default Studio;
