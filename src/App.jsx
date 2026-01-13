import React, { useState } from 'react';
import { Heart, Lightbulb, PenTool, Palette, History } from 'lucide-react';
import Planner from './components/Planner';
import Creator from './components/Creator';
import Studio from './components/Studio';
import HistoryPanel from './components/HistoryPanel';
import './index.css';

function App() {
  const [activeTab, setActiveTab] = useState('planner');
  const [topic, setTopic] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('insta_feed');
  const [generatedImageUrl, setGeneratedImageUrl] = useState('');
  const [canvasBg, setCanvasBg] = useState('');
  const [canvasObjects, setCanvasObjects] = useState([]);
  const [canvasAspectRatio, setCanvasAspectRatio] = useState('1:1');
  const [history, setHistory] = useState([]);
  const [showToast, setShowToast] = useState(false);

  const useIdea = (idea) => {
    setTopic(idea.title);
    setSelectedTemplate(idea.type);
    setActiveTab('create');
  };

  const sendToStudio = (imageUrl, topicText, aspectRatio = '1:1') => {
    setCanvasBg(imageUrl);
    setCanvasAspectRatio(aspectRatio);
    setCanvasObjects([{
      id: Date.now(),
      type: 'text',
      text: topicText || '제목 입력',
      x: 40, y: 40,
      width: 320, height: 60,
      color: '#ffffff',
      bg: 'rgba(0,0,0,0.5)',
      fontSize: 32,
      fontWeight: 'bold',
      fontFamily: 'sans-serif',
      textAlign: 'center',
      borderRadius: 8,
      opacity: 1,
      strokeWidth: 0,
      strokeColor: '#000000',
      isGradient: false,
      gradientStops: [
        { position: 0, color: '#FF007A', alpha: 1 },
        { position: 100, color: '#6366F1', alpha: 1 }
      ],
      gradientAngle: 180,
      effects: []
    }]);
    setActiveTab('studio');
  };

  const saveToHistory = (imageUrl, topicText) => {
    const newItem = {
      id: Date.now(),
      image: imageUrl,
      topic: topicText,
      date: new Date().toLocaleDateString('ko-KR')
    };
    setHistory([newItem, ...history]);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  };

  const openFromHistory = (item) => {
    setCanvasBg(item.image);
    setCanvasObjects([{
      id: Date.now(),
      type: 'text',
      text: item.topic,
      x: 50, y: 50,
      width: 300, height: 60,
      color: '#fff',
      fontSize: 24,
      fontWeight: 'bold',
      fontFamily: 'sans-serif',
      bg: 'rgba(0,0,0,0.5)',
      opacity: 1,
      borderRadius: 8,
      strokeWidth: 0,
      strokeColor: '#000',
      isGradient: false,
      gradientStops: [
        { position: 0, color: '#FF007A', alpha: 1 },
        { position: 100, color: '#6366F1', alpha: 1 }
      ],
      gradientAngle: 180,
      effects: []
    }]);
    setActiveTab('studio');
  };

  const menus = [
    { id: 'planner', icon: Lightbulb, label: '기획' },
    { id: 'create', icon: PenTool, label: '제작' },
    { id: 'studio', icon: Palette, label: '디자인' },
    { id: 'history', icon: History, label: '보관' }
  ];

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* Sidebar */}
      <aside style={{
        width: '80px',
        backgroundColor: 'white',
        borderRight: '1px solid #E2E8F0',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '24px 0',
        flexShrink: 0,
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
      }}>
        <div style={{
          width: '44px',
          height: '44px',
          background: 'linear-gradient(135deg, #FF007A 0%, #FF5BA3 100%)',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(255,0,122,0.3)',
          marginBottom: '32px'
        }}>
          <Heart fill="white" color="white" size={22} />
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', width: '100%', gap: '8px', padding: '0 8px' }}>
          {menus.map(menu => (
            <button
              key={menu.id}
              onClick={() => setActiveTab(menu.id)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '12px 8px',
                borderRadius: '12px',
                backgroundColor: activeTab === menu.id ? '#FDF2F8' : 'transparent',
                color: activeTab === menu.id ? '#FF007A' : '#94A3B8',
                fontWeight: activeTab === menu.id ? '700' : '500',
                fontSize: '10px',
                border: 'none',
                transition: 'all 0.15s ease'
              }}
            >
              <menu.icon size={24} strokeWidth={activeTab === menu.id ? 2.5 : 2} />
              <span style={{ marginTop: '4px' }}>{menu.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
        {/* Header */}
        <header style={{
          height: '56px',
          backgroundColor: 'white',
          borderBottom: '1px solid #E2E8F0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
          flexShrink: 0
        }}>
          <h2 style={{ fontWeight: '700', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            {activeTab === 'studio' ? '🎨 디자인 스튜디오' :
              activeTab === 'planner' ? '💡 아이디어 기획' :
                activeTab === 'create' ? '✨ 컨텐츠 제작' : '📂 보관함'}
            {activeTab === 'studio' && (
              <span style={{
                fontSize: '11px',
                color: '#94A3B8',
                fontWeight: '400',
                backgroundColor: '#F1F5F9',
                padding: '2px 8px',
                borderRadius: '12px'
              }}>편집 모드</span>
            )}
          </h2>
        </header>

        {/* Content Area */}
        <div style={{ flex: 1, overflow: 'hidden', backgroundColor: '#F1F5F9', position: 'relative' }}>
          {activeTab === 'planner' && (
            <Planner onUseIdea={useIdea} />
          )}

          {activeTab === 'create' && (
            <Creator
              topic={topic}
              setTopic={setTopic}
              generatedImageUrl={generatedImageUrl}
              setGeneratedImageUrl={setGeneratedImageUrl}
              onSendToStudio={sendToStudio}
            />
          )}

          {activeTab === 'studio' && (
            <Studio
              canvasBg={canvasBg}
              setCanvasBg={setCanvasBg}
              canvasObjects={canvasObjects}
              setCanvasObjects={setCanvasObjects}
              canvasAspectRatio={canvasAspectRatio}
              setCanvasAspectRatio={setCanvasAspectRatio}
              onSave={saveToHistory}
              topic={topic}
            />
          )}

          {activeTab === 'history' && (
            <HistoryPanel
              history={history}
              onOpenItem={openFromHistory}
            />
          )}
        </div>
      </main>

      {/* Toast */}
      {showToast && (
        <div className="animate-fade-in-up" style={{
          position: 'fixed',
          bottom: '40px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: '#1E293B',
          color: 'white',
          padding: '12px 24px',
          borderRadius: '24px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '14px',
          fontWeight: '500',
          zIndex: 1000
        }}>
          ✓ 저장되었습니다!
        </div>
      )}
    </div>
  );
}

export default App;
