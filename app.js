// URLで ?r=50000 みたいに半径を変更できる
const url = new URL(location.href);
const RADIUS_M = Number(url.searchParams.get('r') || '150'); // 既定150
console.log('[NL] RADIUS_M =', RADIUS_M);

const $status = document.getElementById('status');
const $cards  = document.getElementById('cards');
const $locBtn = document.getElementById('locBtn');
const $noteBtn= document.getElementById('noteBtn');

async function fetchSpots(){
  const res = await fetch(GEOJSON_URL, {cache:'no-store'});
  return await res.json();
}

function haversine(lat1, lon1, lat2, lon2) {
  const toRad = d => d*Math.PI/180, R = 6371000;
  const dLat = toRad(lat2-lat1), dLon = toRad(lon2-lon1);
  const a = Math.sin(dLat/2)**2 + Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*Math.sin(dLon/2)**2;
  return 2*R*Math.asin(Math.sqrt(a));
}

function isoToLocal(iso){ return new Date(iso).toLocaleString(); }

function createCard(feature, dist){
  const { title, tag, unlock_at, payload_url } = feature.properties;
  const unlocked = Date.now() >= Date.parse(unlock_at);
  const el = document.createElement('div');
  el.className = 'card';
  el.innerHTML = `
    <div class="muted">${tag||''}</div>
    <h3 style="margin-top:6px">${title}</h3>
    <div class="muted">距離：約 ${Math.round(dist)} m｜解禁: ${isoToLocal(unlock_at)}</div>
    <div style="margin-top:10px">
      <a class="btn" target="_blank" rel="noopener" ${unlocked ? '' : 'aria-disabled="true"'} href="${unlocked ? payload_url : '#'}">
        ${unlocked ? 'ZINEを開く' : '未解禁'}
      </a>
    </div>`;
  return el;
}

async function scan(){
  try{
    if (!navigator.geolocation){
      $status.textContent = 'この端末は位置情報に対応していません。';
      return;
    }
    $status.textContent = '現在地を取得中…';
    const pos = await new Promise((ok, ng)=>{
      navigator.geolocation.getCurrentPosition(ok, ng, {enableHighAccuracy:true, timeout:10000});
    });
    const { latitude, longitude } = pos.coords;
    $status.textContent = `現在地: ${latitude.toFixed(5)}, ${longitude.toFixed(5)}（近接スポット検索）`;

    const geo = await fetchSpots();
    $cards.innerHTML = '';
    const near = [];
    for (const f of geo.features){
      const [lon, lat] = f.geometry.coordinates; // [lon, lat]
      const d = haversine(latitude, longitude, lat, lon);
      if (d <= RADIUS_M) near.push({f, d});
    }
    if (near.length === 0){
      $status.textContent = `近接スポットは見つかりません（半径${RADIUS_M}m）。`;
      return;
    }
    for (const n of near.sort((a,b)=>a.d-b.d)){
      $cards.appendChild(createCard(n.f, n.d));
      maybeNotify(n.f);
    }
    $status.textContent = `近接スポット：${near.length}件`;
  }catch(e){
    console.error(e);
    $status.textContent = '位置取得に失敗。端末の位置情報設定をご確認ください。';
  }
}

async function askNotification(){
  if (!('Notification' in window)) { alert('通知非対応のブラウザ'); return; }
  const perm = await Notification.requestPermission();
  if (perm !== 'granted'){ alert('通知が許可されていません'); return; }
  if ('serviceWorker' in navigator){
    const reg = await navigator.serviceWorker.getRegistration();
    if (reg){ reg.showNotification('Nameless Light', { body: '通知がONになりました。' }); }
  }
}

async function maybeNotify(feature){
  try{
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    if (!('serviceWorker' in navigator)) return;
    const reg = await navigator.serviceWorker.getRegistration();
    if (!reg) return;
    const title = feature.properties.title || 'Resonance Node';
    reg.showNotification(title, { body: '近くでZINEが点灯しています。', tag: 'nl-resonance' });
  }catch(e){}
}
$locBtn?.addEventListener('click', scan);
$noteBtn?.addEventListener('click', askNotification);