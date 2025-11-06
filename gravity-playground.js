
const { useState, useEffect, useRef } = React;

const GravityPlayground = () => {
  const canvasRef = useRef(null);
  const [gravity, setGravity] = useState(0.3);
  const [selectedPlanet, setSelectedPlanet] = useState('earth');
  const [customValue, setCustomValue] = useState('0.3');
  const [playerSpeed, setPlayerSpeed] = useState(0.4);
  const [playerMass, setPlayerMass] = useState(2);
  const playerRef = useRef({
    x: 150,
    y: 150,
    vx: 0,
    vy: 0,
    width: 30,
    height: 30,
    grounded: false,
    mass: 2
  });
  const [objects, setObjects] = useState([]);
  const keysRef = useRef({});
  const [showTrails, setShowTrails] = useState(true);
  const trailsRef = useRef([]);
  const objectsRef = useRef([]);

  const planets = {
    mercury: { name: 'Mercury', gravity: 0.19 },
    venus: { name: 'Venus', gravity: 0.3 },
    earth: { name: 'Earth', gravity: 0.3 },
    moon: { name: 'Moon', gravity: 0.05 },
    mars: { name: 'Mars', gravity: 0.15 },
    jupiter: { name: 'Jupiter', gravity: 0.8 },
    saturn: { name: 'Saturn', gravity: 0.4 },
    uranus: { name: 'Uranus', gravity: 0.35 },
    neptune: { name: 'Neptune', gravity: 0.4 },
    pluto: { name: 'Pluto', gravity: 0.02 },
    space: { name: 'Zero Gravity', gravity: 0 },
    reverse: { name: 'Reverse Gravity', gravity: -0.3 }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      keysRef.current[e.key.toLowerCase()] = true;
      if (e.key === ' ') e.preventDefault();
    };
    const handleKeyUp = (e) => {
      keysRef.current[e.key.toLowerCase()] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  useEffect(() => {
    objectsRef.current = objects;
  }, [objects]);

  useEffect(() => {
    playerRef.current.mass = playerMass;
  }, [playerMass]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationId;
    let lastTime = performance.now();

    const checkCollision = (a, b) => {
      return a.x < b.x + b.width &&
             a.x + a.width > b.x &&
             a.y < b.y + b.height &&
             a.y + a.height > b.y;
    };

    const resolveCollision = (obj1, obj2) => {
      const dx = (obj1.x + obj1.width / 2) - (obj2.x + obj2.width / 2);
      const dy = (obj1.y + obj1.height / 2) - (obj2.y + obj2.height / 2);
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance === 0) return;
      
      const nx = dx / distance;
      const ny = dy / distance;
      
      const relVelX = obj1.vx - obj2.vx;
      const relVelY = obj1.vy - obj2.vy;
      const velAlongNormal = relVelX * nx + relVelY * ny;
      
      if (velAlongNormal > 0) return;
      
      const bounce = 0.5;
      const mass1 = obj1.mass || 1;
      const mass2 = obj2.mass || 1;
      const totalMass = mass1 + mass2;
      
      const impulse = (-(1 + bounce) * velAlongNormal) / (1/mass1 + 1/mass2);
      
      obj1.vx += (impulse * nx) / mass1;
      obj1.vy += (impulse * ny) / mass1;
      obj2.vx -= (impulse * nx) / mass2;
      obj2.vy -= (impulse * ny) / mass2;
      
      const overlap = (obj1.width / 2 + obj2.width / 2) - distance;
      const totalWeight = mass1 + mass2;
      obj1.x += nx * overlap * (mass2 / totalWeight);
      obj1.y += ny * overlap * (mass2 / totalWeight);
      obj2.x -= nx * overlap * (mass1 / totalWeight);
      obj2.y -= ny * overlap * (mass1 / totalWeight);
    };

    const update = () => {
      const player = playerRef.current;
      const keys = keysRef.current;

      const moveSpeed = playerSpeed;
      const maxSpeed = 8;
      const jumpPower = 9;

      if (keys['a'] || keys['arrowleft']) player.vx -= moveSpeed;
      if (keys['d'] || keys['arrowright']) player.vx += moveSpeed;
      
      if (keys[' '] && player.grounded) {
        player.vy = -jumpPower;
        player.grounded = false;
      }

      player.vy += gravity;
      player.vx *= 0.88;

      player.vx = Math.max(-maxSpeed, Math.min(maxSpeed, player.vx));
      player.vy = Math.max(-20, Math.min(20, player.vy));

      player.x += player.vx;
      player.y += player.vy;

      player.grounded = false;

      if (player.y + player.height >= canvas.height) {
        player.y = canvas.height - player.height;
        player.vy = 0;
        player.grounded = true;
        player.vx *= 0.8;
      }

      if (player.y <= 0) {
        player.y = 0;
        player.vy *= -0.5;
      }

      if (player.x <= 0) {
        player.x = 0;
        player.vx *= -0.5;
      }
      if (player.x + player.width >= canvas.width) {
        player.x = canvas.width - player.width;
        player.vx *= -0.5;
      }

      const updatedObjects = objectsRef.current.map(obj => {
        const newObj = { ...obj };
        
        newObj.vy += gravity;
        newObj.vx *= 0.99;
        newObj.vy *= 0.995;

        newObj.x += newObj.vx;
        newObj.y += newObj.vy;

        if (newObj.y + newObj.height >= canvas.height) {
          newObj.y = canvas.height - newObj.height;
          newObj.vy *= -0.6;
          newObj.vx *= 0.92;
          if (Math.abs(newObj.vy) < 0.2) newObj.vy = 0;
        }

        if (newObj.y <= 0) {
          newObj.y = 0;
          newObj.vy *= -0.6;
        }

        if (newObj.x <= 0) {
          newObj.x = 0;
          newObj.vx *= -0.7;
        }
        if (newObj.x + newObj.width >= canvas.width) {
          newObj.x = canvas.width - newObj.width;
          newObj.vx *= -0.7;
        }

        if (checkCollision(player, newObj)) {
          resolveCollision(player, newObj);
        }

        return newObj;
      });

      for (let i = 0; i < updatedObjects.length; i++) {
        for (let j = i + 1; j < updatedObjects.length; j++) {
          if (checkCollision(updatedObjects[i], updatedObjects[j])) {
            resolveCollision(updatedObjects[i], updatedObjects[j]);
          }
        }
      }

      setObjects(updatedObjects);

      if (showTrails && (Math.abs(player.vx) > 0.3 || Math.abs(player.vy) > 0.3)) {
        trailsRef.current.push({
          x: player.x + player.width / 2,
          y: player.y + player.height / 2,
          life: 25
        });
        if (trailsRef.current.length > 40) trailsRef.current.shift();
      }
    };

    const draw = () => {
      const player = playerRef.current;

      ctx.fillStyle = '#0a0a0a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.strokeStyle = '#1a1a1a';
      ctx.lineWidth = 1;
      for (let x = 0; x < canvas.width; x += 50) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += 50) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      if (showTrails) {
        trailsRef.current = trailsRef.current.filter(t => t.life > 0);
        trailsRef.current.forEach(trail => {
          trail.life--;
          const alpha = trail.life / 25;
          ctx.fillStyle = `rgba(100, 200, 255, ${alpha * 0.6})`;
          ctx.beginPath();
          ctx.arc(trail.x, trail.y, 6, 0, Math.PI * 2);
          ctx.fill();
        });
      }

      objectsRef.current.forEach(obj => {
        if (obj.type === 'rock') {
          const gradient = ctx.createRadialGradient(
            obj.x + obj.width / 2, obj.y + obj.height / 2, 5,
            obj.x + obj.width / 2, obj.y + obj.height / 2, obj.width / 2
          );
          gradient.addColorStop(0, '#a0826d');
          gradient.addColorStop(1, '#6b5d54');
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(obj.x + obj.width / 2, obj.y + obj.height / 2, obj.width / 2, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#4a3f37';
          ctx.lineWidth = 2;
          ctx.stroke();
        } else if (obj.type === 'square') {
          const gradient = ctx.createLinearGradient(obj.x, obj.y, obj.x + obj.width, obj.y + obj.height);
          gradient.addColorStop(0, '#ff6b6b');
          gradient.addColorStop(1, '#c92a2a');
          ctx.fillStyle = gradient;
          ctx.fillRect(obj.x, obj.y, obj.width, obj.height);
          ctx.strokeStyle = '#8b1e1e';
          ctx.lineWidth = 2;
          ctx.strokeRect(obj.x, obj.y, obj.width, obj.height);
        }
      });

      const gradient = ctx.createLinearGradient(player.x, player.y, player.x + player.width, player.y + player.height);
      gradient.addColorStop(0, '#5dade2');
      gradient.addColorStop(1, '#2874a6');
      ctx.fillStyle = gradient;
      ctx.fillRect(player.x, player.y, player.width, player.height);
      ctx.strokeStyle = '#1a5276';
      ctx.lineWidth = 2;
      ctx.strokeRect(player.x, player.y, player.width, player.height);

      ctx.fillStyle = '#fff';
      ctx.fillRect(player.x + 6, player.y + 8, 6, 6);
      ctx.fillRect(player.x + 18, player.y + 8, 6, 6);

      ctx.fillStyle = '#000';
      ctx.fillRect(player.x + 8, player.y + 10, 3, 3);
      ctx.fillRect(player.x + 20, player.y + 10, 3, 3);

      if (player.grounded) {
        ctx.fillStyle = '#2ecc71';
        ctx.fillRect(player.x, player.y + player.height + 3, player.width, 3);
      }
    };

    const gameLoop = () => {
      const currentTime = performance.now();
      const deltaTime = currentTime - lastTime;
      
      if (deltaTime >= 16) {
        update();
        draw();
        lastTime = currentTime;
      }
      
      animationId = requestAnimationFrame(gameLoop);
    };

    gameLoop();
    return () => cancelAnimationFrame(animationId);
  }, [gravity, showTrails, playerSpeed]);

  const reset = () => {
    playerRef.current = { x: 150, y: 150, vx: 0, vy: 0, width: 30, height: 30, grounded: false, mass: playerMass };
    trailsRef.current = [];
  };

  const handlePlanetChange = (planetKey) => {
    setSelectedPlanet(planetKey);
    const newGravity = planets[planetKey].gravity;
    setGravity(newGravity);
    setCustomValue(newGravity.toString());
  };

  const applyCustomGravity = () => {
    const val = parseFloat(customValue);
    if (!isNaN(val) && val >= -3 && val <= 3) {
      setGravity(val);
      setSelectedPlanet('custom');
    }
  };

  const addObject = (type) => {
    const size = type === 'rock' ? 35 : 40;
    const newObj = {
      id: Date.now() + Math.random(),
      type: type,
      x: Math.random() * (750 - size - 100) + 50,
      y: -size,
      vx: (Math.random() - 0.5) * 3,
      vy: 0,
      width: size,
      height: size,
      mass: type === 'rock' ? 1.5 : 1
    };
    setObjects(prev => [...prev, newObj]);
  };

  const clearObjects = () => {
    setObjects([]);
  };

  return (
    <div className="flex h-screen bg-gray-900 overflow-hidden">
      <div className="flex-1 p-4 flex flex-col">
        <h1 className="text-2xl text-white mb-3">Gravity Physics Playground</h1>
        <canvas
          ref={canvasRef}
          width={750}
          height={500}
          className="border-2 border-gray-700 bg-black"
        />
        <p className="text-gray-400 mt-2 text-sm">A/D or Arrow Keys = Move | Spacebar = Jump | Higher mass = push objects harder!</p>
      </div>

      <div className="w-96 bg-gray-800 p-5 overflow-y-auto">
        <div className="space-y-4">
          <div className="bg-gray-700 p-4 rounded-lg">
            <h3 className="text-white font-bold mb-3 text-lg">Controls</h3>
            <button 
              onClick={reset} 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg font-semibold mb-2 transition"
            >
              Reset Position
            </button>
            <label className="flex items-center text-white cursor-pointer">
              <input
                type="checkbox"
                checked={showTrails}
                onChange={(e) => setShowTrails(e.target.checked)}
                className="mr-2 w-4 h-4"
              />
              Show Trails
            </label>
          </div>

          <div className="bg-gray-700 p-4 rounded-lg">
            <h3 className="text-white font-bold mb-3 text-lg">Player Settings</h3>
            
            <label className="text-gray-300 text-sm block mb-2 font-semibold">
              Speed: {playerSpeed.toFixed(2)}
            </label>
            <input
              type="range"
              min="0.1"
              max="1"
              step="0.05"
              value={playerSpeed}
              onChange={(e) => setPlayerSpeed(parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-600 rounded-lg mb-3"
            />

            <label className="text-gray-300 text-sm block mb-2 font-semibold">
              Mass: {playerMass.toFixed(1)}
            </label>
            <input
              type="range"
              min="0.5"
              max="5"
              step="0.5"
              value={playerMass}
              onChange={(e) => setPlayerMass(parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-600 rounded-lg"
            />
            <p className="text-gray-400 text-xs mt-2">Higher mass = push objects more!</p>
          </div>

          <div className="bg-gray-700 p-4 rounded-lg">
            <h3 className="text-white font-bold mb-3 text-lg">Gravity</h3>
            <select
              value={selectedPlanet}
              onChange={(e) => handlePlanetChange(e.target.value)}
              className="w-full bg-gray-900 text-white p-2.5 rounded-lg border-2 border-gray-600 focus:border-blue-500 focus:outline-none text-sm mb-2"
            >
              {Object.keys(planets).map(key => (
                <option key={key} value={key}>
                  {planets[key].name} - {planets[key].gravity}
                </option>
              ))}
            </select>
            <p className="text-gray-300 text-sm">Current: {gravity.toFixed(2)}</p>
          </div>

          <div className="bg-gray-700 p-4 rounded-lg">
            <h3 className="text-white font-bold mb-3 text-lg">Custom Gravity</h3>
            <input
              type="range"
              min="-3"
              max="3"
              step="0.05"
              value={gravity}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                setGravity(val);
                setCustomValue(val.toString());
                setSelectedPlanet('custom');
              }}
              className="w-full h-2 bg-gray-600 rounded-lg mb-3"
            />
            <div className="flex gap-2">
              <input
                type="number"
                value={customValue}
                onChange={(e) => setCustomValue(e.target.value)}
                step="0.1"
                className="flex-1 bg-gray-900 text-white p-2 rounded-lg border-2 border-gray-600 focus:border-blue-500 focus:outline-none text-sm"
              />
              <button
                onClick={applyCustomGravity}
                className="px-4 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition text-sm"
              >
                Set
              </button>
            </div>
          </div>

          <div className="bg-gray-700 p-4 rounded-lg">
            <h3 className="text-white font-bold mb-3 text-lg">Add Objects</h3>
            <button
              onClick={() => addObject('rock')}
              className="w-full bg-amber-700 hover:bg-amber-800 text-white py-2.5 rounded-lg font-semibold mb-2 transition"
            >
              Add Rock
            </button>
            <button
              onClick={() => addObject('square')}
              className="w-full bg-red-700 hover:bg-red-800 text-white py-2.5 rounded-lg font-semibold mb-2 transition"
            >
              Add Square
            </button>
            <button
              onClick={clearObjects}
              className="w-full bg-gray-600 hover:bg-gray-500 text-white py-2.5 rounded-lg font-semibold transition"
            >
              Clear All ({objects.length})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Render the app
ReactDOM.render(<GravityPlayground />, document.getElementById('root'));
