import React, { useRef, useEffect, useState, useCallback } from 'react';
import { ZoneId, StudentProfile } from '../types/game';
import { ZONES_METADATA } from '../data/zonesData';
import { playStepSound, playCrystalSound, playTapSound, soundManager } from '../utils/soundEffects';

interface WorldCanvas25DProps {
  currentZone: ZoneId;
  unlockedZones: ZoneId[];
  profile: StudentProfile;
  onSelectZone: (zoneId: ZoneId) => void;
  onEnterTask: (zoneId: ZoneId) => void;
  onOpenJournal: () => void;
  onOpenSettings: () => void;
  onOpenTeacher: () => void;
  onOpenStudentLogin: () => void;
  appMode: 'TRIAL' | 'ONLINE';
}

export const WorldCanvas25D: React.FC<WorldCanvas25DProps> = ({
  currentZone,
  unlockedZones,
  profile,
  onSelectZone,
  onEnterTask,
  onOpenJournal,
  onOpenSettings,
  onOpenTeacher,
  onOpenStudentLogin,
  appMode,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Player position in world coordinates (default to current zone island)
  const initialPos = ZONES_METADATA[currentZone].islandCoordinates;
  const playerPosRef = useRef<{ x: number; y: number }>({ x: initialPos.x, y: initialPos.y });
  const targetPosRef = useRef<{ x: number; y: number }>({ x: initialPos.x, y: initialPos.y });
  const playerFacingRef = useRef<'left' | 'right' | 'up' | 'down'>('down');
  const walkCycleRef = useRef<number>(0);
  const isMovingRef = useRef<boolean>(false);
  const keysDownRef = useRef<{ [key: string]: boolean }>({});
  const lastStepTimeRef = useRef<number>(0);

  // Proximity to zone portal for interactive prompt
  const [nearbyZone, setNearbyZone] = useState<ZoneId | null>(currentZone);

  // Synchronize player position when currentZone changes (e.g. progressing to next zone or unlocking)
  useEffect(() => {
    const coords = ZONES_METADATA[currentZone].islandCoordinates;
    playerPosRef.current = { x: coords.x, y: coords.y };
    targetPosRef.current = { x: coords.x, y: coords.y };
    setNearbyZone(currentZone);
  }, [currentZone]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't capture inputs if typing in an input box
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      const code = e.key.toLowerCase();
      if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(code)) {
        keysDownRef.current[code] = true;
      }
      if (e.key === 'e' || e.key === 'E' || e.key === 'Enter' || e.key === ' ') {
        if (nearbyZone && unlockedZones.includes(nearbyZone)) {
          e.preventDefault();
          playTapSound();
          onEnterTask(nearbyZone);
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const code = e.key.toLowerCase();
      keysDownRef.current[code] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [nearbyZone, unlockedZones, onEnterTask]);

  // Touch / Click to move or interact
  const handleCanvasPointer = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      // Scale to internal canvas coordinate space
      const scaleX = 1380 / rect.width;
      const scaleY = 620 / rect.height;
      const worldX = clickX * scaleX;
      const worldY = clickY * scaleY;

      // Check if clicked directly on an island or portal
      for (const zoneKey of [1, 2, 3, 4, 5] as ZoneId[]) {
        const zone = ZONES_METADATA[zoneKey];
        const dist = Math.hypot(worldX - zone.islandCoordinates.x, worldY - zone.islandCoordinates.y);
        if (dist < 95) {
          targetPosRef.current = { x: zone.islandCoordinates.x, y: zone.islandCoordinates.y };
          onSelectZone(zoneKey);
          if (unlockedZones.includes(zoneKey)) {
            playTapSound();
            onEnterTask(zoneKey);
          }
          return;
        }
      }

      // Otherwise walk to clicked position
      targetPosRef.current = { x: worldX, y: worldY };
    },
    [unlockedZones, onSelectZone, onEnterTask]
  );

  // Virtual D-pad directional helpers for mobile
  const handleDpadMove = (dx: number, dy: number) => {
    targetPosRef.current = {
      x: Math.max(80, Math.min(1300, playerPosRef.current.x + dx * 75)),
      y: Math.max(120, Math.min(540, playerPosRef.current.y + dy * 75)),
    };
  };

  // Main 2.5D animation render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animFrameId: number;
    let time = 0;

    const render = () => {
      time += 0.035;

      // Update position from keys
      const keys = keysDownRef.current;
      let moveX = 0;
      let moveY = 0;
      if (keys['w'] || keys['arrowup']) moveY -= 1;
      if (keys['s'] || keys['arrowdown']) moveY += 1;
      if (keys['a'] || keys['arrowleft']) moveX -= 1;
      if (keys['d'] || keys['arrowright']) moveX += 1;

      if (moveX !== 0 || moveY !== 0) {
        const len = Math.hypot(moveX, moveY) || 1;
        const speed = 4.2;
        playerPosRef.current.x += (moveX / len) * speed;
        playerPosRef.current.y += (moveY / len) * speed;
        targetPosRef.current = { ...playerPosRef.current };
        isMovingRef.current = true;
        if (Math.abs(moveX) > Math.abs(moveY)) {
          playerFacingRef.current = moveX > 0 ? 'right' : 'left';
        } else {
          playerFacingRef.current = moveY > 0 ? 'down' : 'up';
        }
      } else {
        // Smoothly interpolate towards target position from mouse/touch
        const dx = targetPosRef.current.x - playerPosRef.current.x;
        const dy = targetPosRef.current.y - playerPosRef.current.y;
        const dist = Math.hypot(dx, dy);

        if (dist > 3) {
          isMovingRef.current = true;
          const speed = Math.min(dist * 0.12, 4.8);
          playerPosRef.current.x += (dx / dist) * speed;
          playerPosRef.current.y += (dy / dist) * speed;
          if (Math.abs(dx) > Math.abs(dy)) {
            playerFacingRef.current = dx > 0 ? 'right' : 'left';
          } else {
            playerFacingRef.current = dy > 0 ? 'down' : 'up';
          }
        } else {
          isMovingRef.current = false;
        }
      }

      // Bound player inside map
      playerPosRef.current.x = Math.max(90, Math.min(1290, playerPosRef.current.x));
      playerPosRef.current.y = Math.max(140, Math.min(530, playerPosRef.current.y));

      // Walk cycle animation
      if (isMovingRef.current) {
        walkCycleRef.current += 0.22;
        const now = Date.now();
        if (now - lastStepTimeRef.current > 320) {
          playStepSound();
          lastStepTimeRef.current = now;
        }
      } else {
        walkCycleRef.current = 0;
      }

      // Check proximity to any island portal
      let closeZone: ZoneId | null = null;
      for (const zId of [1, 2, 3, 4, 5] as ZoneId[]) {
        const zone = ZONES_METADATA[zId];
        const dist = Math.hypot(playerPosRef.current.x - zone.islandCoordinates.x, playerPosRef.current.y - zone.islandCoordinates.y);
        if (dist < 80) {
          closeZone = zId;
          break;
        }
      }
      setNearbyZone(closeZone);

      // --- DRAW CANVAS ---
      ctx.clearRect(0, 0, 1380, 620);

      // 1. Cosmic Void Background
      const bgGrad = ctx.createLinearGradient(0, 0, 0, 620);
      bgGrad.addColorStop(0, '#0a0618');
      bgGrad.addColorStop(0.5, '#120b2e');
      bgGrad.addColorStop(1, '#1b1244');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, 1380, 620);

      // Cosmic background stars
      for (let i = 0; i < 48; i++) {
        const starX = ((i * 73 + time * 6) % 1380);
        const starY = (i * 37) % 580 + 20;
        const starSize = (i % 3 === 0) ? 2.5 : 1.5;
        const alpha = 0.3 + 0.5 * Math.sin(time * 1.5 + i);
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.beginPath();
        ctx.arc(starX, starY, starSize, 0, Math.PI * 2);
        ctx.fill();
      }

      // 2. Light Bridges / Cosmic stepping paths between islands
      const zonesList: ZoneId[] = [1, 2, 3, 4, 5];
      for (let i = 0; i < zonesList.length - 1; i++) {
        const fromZone = ZONES_METADATA[zonesList[i]];
        const toZone = ZONES_METADATA[zonesList[i + 1]];
        const isUnlocked = unlockedZones.includes(zonesList[i + 1]);

        ctx.save();
        ctx.beginPath();
        ctx.moveTo(fromZone.islandCoordinates.x, fromZone.islandCoordinates.y + 20);
        ctx.lineTo(toZone.islandCoordinates.x, toZone.islandCoordinates.y + 20);

        if (isUnlocked) {
          ctx.strokeStyle = 'rgba(6, 182, 212, 0.45)';
          ctx.lineWidth = 14;
          ctx.setLineDash([12, 8]);
          ctx.lineDashOffset = -time * 15;
          ctx.stroke();

          ctx.strokeStyle = 'rgba(245, 158, 11, 0.8)';
          ctx.lineWidth = 4;
          ctx.setLineDash([6, 14]);
          ctx.stroke();
        } else {
          ctx.strokeStyle = 'rgba(100, 116, 139, 0.25)';
          ctx.lineWidth = 8;
          ctx.setLineDash([8, 8]);
          ctx.stroke();
        }
        ctx.restore();
      }

      // 3. Render 5 Floating Islands in 2.5D Blocky Obby Style
      zonesList.forEach((zId) => {
        const zone = ZONES_METADATA[zId];
        const isUnlocked = unlockedZones.includes(zId);
        const isCurrent = currentZone === zId;
        const coords = zone.islandCoordinates;
        const floatY = Math.sin(time + zId * 1.3) * 6;

        ctx.save();
        ctx.translate(coords.x, coords.y + floatY);

        // Island Drop Shadow in the cosmic mist
        ctx.beginPath();
        ctx.ellipse(0, 52, 95, 32, 0, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
        ctx.fill();

        // 2.5D Island Block Cliff (Bottom / Depth)
        ctx.beginPath();
        ctx.ellipse(0, 24, 88, 38, 0, 0, Math.PI);
        ctx.lineTo(-88, 0);
        ctx.ellipse(0, 0, 88, 38, 0, Math.PI, 0, true);
        ctx.closePath();
        ctx.fillStyle = isUnlocked ? '#22194d' : '#1e2235';
        ctx.fill();
        ctx.strokeStyle = isUnlocked ? '#3b2f75' : '#2d334d';
        ctx.lineWidth = 3;
        ctx.stroke();

        // 2.5D Island Grass / Surface
        ctx.beginPath();
        ctx.ellipse(0, 0, 88, 38, 0, 0, Math.PI * 2);
        if (isUnlocked) {
          const surfGrad = ctx.createRadialGradient(0, -5, 10, 0, 0, 88);
          surfGrad.addColorStop(0, zone.themeColor);
          surfGrad.addColorStop(1, '#1e1445');
          ctx.fillStyle = surfGrad;
        } else {
          ctx.fillStyle = '#2d3748';
        }
        ctx.fill();
        ctx.strokeStyle = isUnlocked ? zone.accentColor : '#475569';
        ctx.lineWidth = isCurrent ? 3.5 : 2;
        ctx.stroke();

        // Portal Arch / Shrine on Island
        const archHeight = 48;
        ctx.fillStyle = isUnlocked ? '#372b6b' : '#334155';
        // Left pillar
        ctx.fillRect(-34, -archHeight, 10, archHeight);
        // Right pillar
        ctx.fillRect(24, -archHeight, 10, archHeight);
        // Top lintel
        ctx.fillRect(-38, -archHeight - 8, 76, 10);

        // Glowing Portal Gateway Energy
        if (isUnlocked) {
          ctx.save();
          ctx.beginPath();
          ctx.rect(-24, -archHeight + 2, 48, archHeight - 4);
          const portalGrad = ctx.createLinearGradient(0, -archHeight, 0, 0);
          portalGrad.addColorStop(0, zone.accentColor);
          portalGrad.addColorStop(1, 'rgba(6, 182, 212, 0.2)');
          ctx.fillStyle = portalGrad;
          ctx.globalAlpha = 0.55 + 0.35 * Math.sin(time * 3 + zId);
          ctx.fill();
          ctx.restore();

          // Floating Crystal / Crown above portal
          const crystalY = -archHeight - 26 + Math.sin(time * 2.5 + zId) * 5;
          ctx.save();
          ctx.translate(0, crystalY);
          if (zId === 5 && profile.hasCrown) {
            // Golden Crown
            ctx.fillStyle = '#fbbf24';
            ctx.beginPath();
            ctx.moveTo(-16, -6);
            ctx.lineTo(-12, 10);
            ctx.lineTo(12, 10);
            ctx.lineTo(16, -6);
            ctx.lineTo(6, 2);
            ctx.lineTo(0, -8);
            ctx.lineTo(-6, 2);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = '#fef08a';
            ctx.lineWidth = 2;
            ctx.stroke();
          } else {
            // Octahedron Crystal
            ctx.beginPath();
            ctx.moveTo(0, -14);
            ctx.lineTo(10, 0);
            ctx.lineTo(0, 14);
            ctx.lineTo(-10, 0);
            ctx.closePath();
            ctx.fillStyle = zone.accentColor;
            ctx.shadowColor = zone.accentColor;
            ctx.shadowBlur = 14;
            ctx.fill();
          }
          ctx.restore();
        } else {
          // Lock symbol on locked islands
          ctx.fillStyle = '#94a3b8';
          ctx.font = '16px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('🔒', 0, -20);
        }

        // Zone Name Plate
        ctx.fillStyle = isUnlocked ? '#ffffff' : '#94a3b8';
        ctx.font = 'bold 16px Outfit, sans-serif';
        ctx.textAlign = 'center';
        ctx.shadowColor = 'rgba(0,0,0,0.9)';
        ctx.shadowBlur = 8;
        ctx.fillText(`Vùng ${zId}: ${zone.name}`, 0, 26);
        ctx.shadowBlur = 0;

        ctx.restore();
      });

      // 4. Render Player Character (Custom 2.5D Obby Blocky Character)
      const pX = playerPosRef.current.x;
      const pY = playerPosRef.current.y;
      const bob = Math.sin(walkCycleRef.current) * 3;
      const legSwing = Math.sin(walkCycleRef.current) * 6;

      ctx.save();
      ctx.translate(pX, pY);

      // Player Drop Shadow
      ctx.beginPath();
      ctx.ellipse(0, 6, 16, 8, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
      ctx.fill();

      // Legs (Blocky obby style)
      ctx.fillStyle = '#1e293b';
      // Left leg
      ctx.fillRect(-8, -12 + (isMovingRef.current ? legSwing : 0), 6, 14);
      // Right leg
      ctx.fillRect(2, -12 - (isMovingRef.current ? legSwing : 0), 6, 14);

      // Torso / Shirt (Custom color)
      ctx.fillStyle = profile.avatarColor || '#06b6d4';
      ctx.fillRect(-10, -28 + bob, 20, 16);
      ctx.strokeStyle = 'rgba(0,0,0,0.25)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(-10, -28 + bob, 20, 16);

      // Arms
      ctx.fillStyle = profile.avatarColor || '#06b6d4';
      const armSwing = Math.sin(walkCycleRef.current) * 5;
      ctx.fillRect(-15, -27 + bob - armSwing, 4, 12);
      ctx.fillRect(11, -27 + bob + armSwing, 4, 12);

      // Head (Cube/Blocky face)
      ctx.fillStyle = '#fde047'; // Friendly bright skin
      ctx.fillRect(-9, -44 + bob, 18, 16);
      ctx.strokeRect(-9, -44 + bob, 18, 16);

      // Face features based on facing direction
      ctx.fillStyle = '#0f172a';
      if (playerFacingRef.current === 'right') {
        ctx.fillRect(1, -40 + bob, 3, 4);
        ctx.fillRect(5, -40 + bob, 3, 4);
      } else if (playerFacingRef.current === 'left') {
        ctx.fillRect(-8, -40 + bob, 3, 4);
        ctx.fillRect(-4, -40 + bob, 3, 4);
      } else if (playerFacingRef.current === 'down') {
        ctx.fillRect(-5, -40 + bob, 3, 4);
        ctx.fillRect(2, -40 + bob, 3, 4);
        ctx.fillRect(-2, -33 + bob, 4, 2); // smile
      }

      // Hair / Cap
      ctx.fillStyle = '#78350f';
      ctx.fillRect(-10, -47 + bob, 20, 4);

      // Royal Crown if won
      if (profile.hasCrown) {
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.moveTo(-10, -52 + bob);
        ctx.lineTo(-7, -47 + bob);
        ctx.lineTo(0, -54 + bob);
        ctx.lineTo(7, -47 + bob);
        ctx.lineTo(10, -52 + bob);
        ctx.lineTo(9, -47 + bob);
        ctx.lineTo(-9, -47 + bob);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#eab308';
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // Nickname above player
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 14px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.shadowColor = 'rgba(0,0,0,0.95)';
      ctx.shadowBlur = 6;
      ctx.fillText(profile.nickname || 'Hiệp Sĩ', 0, -56 + bob);
      ctx.shadowBlur = 0;

      ctx.restore();

      animFrameId = requestAnimationFrame(render);
    };

    animFrameId = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(animFrameId);
    };
  }, [currentZone, unlockedZones, profile]);

  const nearbyZoneConfig = nearbyZone ? ZONES_METADATA[nearbyZone] : null;
  const isNearbyUnlocked = nearbyZone ? unlockedZones.includes(nearbyZone) : false;

  return (
    <div ref={containerRef} className="relative w-full h-full flex flex-col items-center justify-center bg-[#0a0618] overflow-hidden select-none">
      {/* Top HUD Bar */}
      <header className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-4 py-2.5 bg-[#110d26]/85 backdrop-blur-md border-b border-purple-900/40">
        {/* Left: Brand & Operating Mode */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">👑</span>
            <span className="font-display font-bold text-base text-white tracking-wide">
              VƯƠNG QUỐC SỐ HỮU TỈ
            </span>
          </div>

          {/* Mode Pill Badge */}
          {appMode === 'TRIAL' ? (
            <span className="text-xs px-2.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-medium">
              CHƠI THỬ – Không đồng bộ tài khoản
            </span>
          ) : (
            <span className="text-xs px-2.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-medium">
              TRỰC TUYẾN – Đã kết nối Firebase
            </span>
          )}
        </div>

        {/* Center: Lives, Crystals, XP - BIGGER FOR PHONES */}
        <div className="flex items-center gap-2 sm:gap-4 text-xs sm:text-base font-bold">
          {/* Lives */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-950/80 border border-red-700/80 text-red-200 shadow-sm">
            <span className="text-base sm:text-lg">❤️</span>
            <span className="font-math font-black">{profile.lives}/{profile.maxLives}</span>
          </div>

          {/* Crystals */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-950/80 border border-cyan-700/80 text-cyan-200 shadow-sm">
            <span className="text-base sm:text-lg">💎</span>
            <span className="font-math font-black">{profile.crystals}/5</span>
          </div>

          {/* XP */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-950/80 border border-amber-700/80 text-amber-200 shadow-sm">
            <span className="text-base sm:text-lg">✨</span>
            <span className="font-math font-black">{profile.xp} XP</span>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Cross-device Sync / Switch Student */}
          <button
            onClick={() => {
              playTapSound();
              onOpenStudentLogin();
            }}
            className="px-3 py-2 text-xs sm:text-sm font-bold text-cyan-200 hover:text-white bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-600 rounded-xl transition-all flex items-center gap-1 cursor-pointer active:scale-95 shadow-sm min-h-[38px]"
            title="Đăng nhập mã học sinh hoặc đồng bộ thiết bị khác"
          >
            <span className="text-sm">📲</span>
            <span className="font-mono text-xs sm:text-sm font-bold">{profile.studentCode}</span>
          </button>

          {/* Quick Sound Toggle Button */}
          <button
            onClick={() => {
              playTapSound();
              soundManager.toggleBGM();
            }}
            className="px-3 py-2 text-xs sm:text-sm font-bold text-slate-200 hover:text-white bg-slate-800/80 hover:bg-slate-700 border border-slate-600 rounded-xl transition-all flex items-center gap-1 cursor-pointer active:scale-95 shadow-sm min-h-[38px]"
            title="Bật/Tắt nhạc nền không gian kỳ ảo"
          >
            <span className="text-sm">🎵</span>
            <span className="hidden sm:inline">Nhạc Nền</span>
          </button>

          <button
            onClick={() => {
              playTapSound();
              onOpenJournal();
            }}
            className="px-3 py-2 text-xs sm:text-sm font-bold text-purple-200 hover:text-white bg-purple-900/60 hover:bg-purple-800 border border-purple-600 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-sm min-h-[38px]"
            title="Nhật ký & Bí kíp số hữu tỉ"
          >
            📖 <span className="hidden md:inline">Nhật Ký</span>
          </button>

          <button
            onClick={() => {
              playTapSound();
              onOpenSettings();
            }}
            className="px-3 py-2 text-xs sm:text-sm font-bold text-slate-200 hover:text-white bg-slate-800/80 hover:bg-slate-700 border border-slate-600 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-sm min-h-[38px]"
            title="Tùy chỉnh nhân vật & Cài đặt âm thanh"
          >
            ⚙️ <span className="hidden md:inline">Cài Đặt</span>
          </button>

          <button
            onClick={() => {
              playTapSound();
              onOpenTeacher();
            }}
            className="px-3 py-2 text-xs sm:text-sm font-bold text-amber-200 hover:text-amber-100 bg-amber-950/80 hover:bg-amber-900 border border-amber-600 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-sm min-h-[38px]"
            title="Màn hình Giáo Viên"
          >
            👨‍🏫 <span className="hidden md:inline">Quản Lý GV</span>
          </button>
        </div>
      </header>

      {/* 2.5D World Canvas */}
      <div className="relative w-full h-full flex items-center justify-center pt-12 pb-16">
        <canvas
          ref={canvasRef}
          width={1380}
          height={620}
          onPointerDown={handleCanvasPointer}
          className="w-full h-full max-w-[1380px] max-h-[620px] object-contain cursor-crosshair touch-none"
        />

        {/* 5-Island Quick Dock: Complete Journey Selector - LARGER CHIPS */}
        <div className="absolute top-14 sm:top-16 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 p-2 bg-[#140e30]/95 backdrop-blur-md rounded-2xl border-2 border-purple-700/80 shadow-2xl max-w-[96vw] overflow-x-auto">
          {([1, 2, 3, 4, 5] as ZoneId[]).map((zId) => {
            const zMeta = ZONES_METADATA[zId];
            const isUnlocked = unlockedZones.includes(zId);
            const isCurrent = currentZone === zId;
            return (
              <button
                key={zId}
                onClick={() => {
                  playTapSound();
                  onSelectZone(zId);
                  if (isUnlocked) {
                    onEnterTask(zId);
                  }
                }}
                className={`px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap active:scale-95 ${
                  isCurrent
                    ? 'bg-purple-600 text-white shadow-xl ring-3 ring-cyan-400'
                    : isUnlocked
                    ? 'bg-purple-950/80 hover:bg-purple-900 text-purple-100 border border-purple-600'
                    : 'bg-slate-900/80 text-slate-500 border border-slate-800 cursor-not-allowed opacity-60'
                }`}
                title={isUnlocked ? `Đến Vùng ${zId}: ${zMeta.name}` : `Vùng ${zId} đang khóa`}
              >
                <span className="text-sm sm:text-base">{zId === 5 ? (profile.hasCrown ? '👑' : '⭐') : isUnlocked ? '💎' : '🔒'}</span>
                <span>Vùng {zId}: {zMeta.name}</span>
              </button>
            );
          })}
        </div>

        {/* Contextual Interaction Callout - PROMINENT FOR PHONES */}
        {nearbyZoneConfig && (
          <div className="absolute bottom-24 sm:bottom-20 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2 animate-bounce">
            {isNearbyUnlocked ? (
              <button
                onClick={() => {
                  playTapSound();
                  onEnterTask(nearbyZoneConfig.id);
                }}
                className="px-8 sm:px-10 py-3.5 sm:py-4 rounded-2xl font-black text-base sm:text-xl tracking-wide text-white bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 shadow-2xl shadow-purple-900/80 border-2 border-white/40 transition-all transform hover:scale-105 active:scale-95 cursor-pointer flex items-center gap-2.5 min-h-[52px]"
              >
                <span className="text-xl sm:text-2xl">⚡</span>
                <span>Vào {nearbyZoneConfig.name}</span>
                <span className="text-xs sm:text-sm bg-black/40 px-2.5 py-1 rounded-lg font-mono font-bold">Chạm để vào</span>
              </button>
            ) : (
              <div className="px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold text-slate-200 bg-slate-900/95 border-2 border-slate-700 flex items-center gap-2 shadow-xl">
                <span>🔒 Hãy hoàn thành vùng trước để mở khóa {nearbyZoneConfig.name}</span>
              </div>
            )}
          </div>
        )}

        {/* Mobile On-Screen D-Pad - ENLARGED BUTTONS FOR THUMBS */}
        <div className="absolute bottom-4 right-4 z-20 md:hidden grid grid-cols-3 gap-2 p-2.5 bg-[#171133]/95 rounded-2xl border-2 border-purple-700 shadow-2xl">
          <div />
          <button
            onPointerDown={() => handleDpadMove(0, -1)}
            className="w-13 h-13 sm:w-15 sm:h-15 flex items-center justify-center bg-purple-900/80 active:bg-purple-600 text-white rounded-xl text-2xl font-black shadow-md"
          >
            ▲
          </button>
          <div />
          <button
            onPointerDown={() => handleDpadMove(-1, 0)}
            className="w-13 h-13 sm:w-15 sm:h-15 flex items-center justify-center bg-purple-900/80 active:bg-purple-600 text-white rounded-xl text-2xl font-black shadow-md"
          >
            ◀
          </button>
          <button
            onPointerDown={() => {
              if (nearbyZone && isNearbyUnlocked) {
                onEnterTask(nearbyZone);
              }
            }}
            className="w-13 h-13 sm:w-15 sm:h-15 flex items-center justify-center bg-cyan-600 active:bg-cyan-500 text-white rounded-xl text-sm sm:text-base font-black shadow-md"
          >
            VÀO
          </button>
          <button
            onPointerDown={() => handleDpadMove(1, 0)}
            className="w-13 h-13 sm:w-15 sm:h-15 flex items-center justify-center bg-purple-900/80 active:bg-purple-600 text-white rounded-xl text-2xl font-black shadow-md"
          >
            ▶
          </button>
          <div />
          <button
            onPointerDown={() => handleDpadMove(0, 1)}
            className="w-13 h-13 sm:w-15 sm:h-15 flex items-center justify-center bg-purple-900/80 active:bg-purple-600 text-white rounded-xl text-2xl font-black shadow-md"
          >
            ▼
          </button>
          <div />
        </div>

        {/* Bottom Helper Bar */}
        <div className="absolute bottom-2 left-4 z-20 hidden md:flex items-center gap-4 text-xs text-purple-300/70 bg-black/40 px-3 py-1.5 rounded-lg border border-purple-900/30">
          <span>🎮 Dùng phím <kbd className="px-1.5 py-0.5 bg-purple-900/60 rounded text-white font-mono">W A S D</kbd> hoặc phím mũi tên để di chuyển</span>
          <span>·</span>
          <span>Chạm/Nhấp chuột vào bất cứ đâu để nhân vật bước tới</span>
        </div>
      </div>
    </div>
  );
};
