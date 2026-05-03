import React from 'react';
import { Link } from 'react-router-dom';
import { Truck, MapPin, CheckCircle } from 'lucide-react';

// Typewriter Component
const TypewriterText = ({ text, delayOffset = 0 }) => {
  let charCounter = 0;
  return (
    <>
      {text.split(' ').map((word, wordIndex, wordsArr) => {
        const wordNode = (
          <span key={wordIndex} style={{ display: 'inline-block' }}>
            {word.split('').map((char, charIndex) => {
              const delay = delayOffset + (charCounter * 0.05);
              charCounter++;
              return (
                <span key={charIndex} className="typing-char" style={{ animationDelay: `${delay}s` }}>
                  {char}
                </span>
              );
            })}
          </span>
        );
        if (wordIndex !== wordsArr.length - 1) charCounter++;
        return (
          <React.Fragment key={wordIndex}>
            {wordNode}
            {wordIndex !== wordsArr.length - 1 && ' '}
          </React.Fragment>
        );
      })}
    </>
  );
};

// Glass Card Component
const GlassCard = ({ pickup, drop, price, date, weight, isVerified, style }) => (
    <div style={{ 
        background: 'linear-gradient(135deg, rgba(16, 25, 43, 0.98) 0%, rgba(26, 38, 58, 0.98) 100%)', 
        border: '1px solid rgba(255,255,255,0.1)', 
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderRadius: '24px', 
        padding: '1.5rem', 
        width: '100%', 
        minWidth: '320px',
        maxWidth: '400px', 
        boxShadow: '0 25px 50px rgba(0,0,0,0.3)',
        boxSizing: 'border-box',
        ...style 
    }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1.25rem', marginBottom: '1.5rem' }}>
            <div style={{display: 'flex', gap: '0.5rem', alignItems: 'center'}}>
                <MapPin color="var(--color-success)" size={20} style={{ flexShrink: 0 }} />
                <span style={{color: '#fff', fontWeight: '500', fontSize: '1.15rem', whiteSpace: 'nowrap'}}>{pickup} → {drop}</span>
            </div>
            <span style={{color: 'var(--color-secondary)', fontWeight: 'bold', fontSize: '1.4rem'}}>₹{price}</span>
        </div>
        
        <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '12px', padding: '1rem', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94A3B8', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                <span>Est. Delivery</span>
                <span>Weight</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#fff', fontWeight: '500' }}>
                <span>{date}</span>
                <span>{weight}</span>
            </div>
        </div>

        {isVerified && (
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', color: '#94A3B8', fontSize: '0.9rem' }}>
                <CheckCircle size={16} color="var(--color-success)"/> Verified Business
            </div>
        )}

        <button className="btn btn-primary" style={{ width: '100%', borderRadius: '12px', padding: '1rem', textAlign: 'center', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
            <Truck size={18} /> Accept Load Now
        </button>
    </div>
);

const Landing = () => (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'transparent' }}>
      {/* Hero Section */}
      <div style={{ color: 'white', flex: 1, display: 'flex', alignItems: 'center', padding: '2rem 1rem', position: 'relative' }}>
        {/* Animated glowing orbs */}
        <div className="animate-pulse-glow" style={{ position: 'absolute', top: '10%', right: '10%', width: '400px', height: '400px', background: 'var(--color-secondary)', borderRadius: '50%', filter: 'blur(120px)', zIndex: 0 }}></div>
        <div className="animate-pulse-glow" style={{ position: 'absolute', bottom: '-10%', left: '-5%', width: '300px', height: '300px', background: 'var(--color-success)', borderRadius: '50%', filter: 'blur(100px)', zIndex: 0, animationDelay: '2s' }}></div>
        
        <div className="container" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '4rem', position: 'relative', zIndex: 1 }}>
          {/* Left Column */}
          <div style={{ flex: '1 1 500px' }}>
  
            <h1 style={{ fontSize: '4rem', marginBottom: '1.5rem', color: 'white', letterSpacing: '-1.5px', lineHeight: '1.1' }}>
              <TypewriterText text="The Smart Way to" delayOffset={0.2} /> <br/> 
              <span style={{ color: 'var(--color-secondary)' }}>
                <TypewriterText text="Move Loads" delayOffset={1.05} />
              </span>
              {' '}
              <TypewriterText text="Faster" delayOffset={1.6} />
            </h1>
            <p className="animate-slide-up-3" style={{ fontSize: '1.25rem', color: '#94A3B8', marginBottom: '3rem', maxWidth: '500px', lineHeight: '1.8' }}>
              Connect instantly with reliable trucks and verified businesses. Eliminate empty return trips, track your freight in real-time, and maximize your profits.
            </p>
            
            <div className="animate-slide-up-4" style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
              <Link to="/auth" className="btn btn-primary" style={{ padding: '1.2rem 3rem', fontSize: '1.2rem', backgroundColor: 'var(--color-secondary)', boxShadow: '0 10px 25px rgba(0,168,232,0.4)', transition: 'all 0.3s ease', borderRadius: 'var(--radius-lg)' }}>
                Get Started Now
              </Link>
            </div>
          </div>
  
          {/* Right Column (Stacked Floating UI Showcase) */}
          <div style={{ flex: '1 1 400px', display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '2rem', minHeight: '400px' }}>
              <div style={{ position: 'relative', width: '100%', maxWidth: '400px', height: '350px' }}>
                  <div className="animate-stack-3" style={{ position: 'absolute', top: 0, left: 0, width: '100%' }}>
                     <GlassCard pickup="Bangalore" drop="Chennai" price="22,000" date="Oct 26, 2:00 PM" weight="5 Tons" isVerified={true} />
                  </div>
                  <div className="animate-stack-2" style={{ position: 'absolute', top: 0, left: 0, width: '100%' }}>
                     <GlassCard pickup="Surat" drop="Indore" price="30,500" date="Oct 25, 6:00 AM" weight="15 Tons" isVerified={false} />
                  </div>
                  <div className="animate-stack-1" style={{ position: 'absolute', top: 0, left: 0, width: '100%' }}>
                     <GlassCard pickup="Mumbai" drop="Delhi" price="45,000" date="Oct 24, 10:00 AM" weight="10 Tons" isVerified={true} />
                  </div>
  
                  {/* Decorative Truck Animation */}
                  <div style={{ position: 'absolute', bottom: '-80px', left: '10%', width: '100%', pointerEvents: 'none', zIndex: 4 }}>
                      <Truck className="animate-truck" size={32} color="var(--color-secondary)" style={{ opacity: 0.6 }} />
                      <div style={{ width: '80%', height: '2px', background: 'linear-gradient(90deg, transparent, var(--color-secondary), transparent)', marginTop: '0.5rem' }}></div>
                  </div>
              </div>
          </div>
        </div>
      </div>
    </div>
);

export default Landing;
