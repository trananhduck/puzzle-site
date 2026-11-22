/* Logic thuần (không đụng DOM) – dùng chung cho game và bộ test.
   Cụm = danh sách ô [dx, dy, cạnh], toạ độ nguyên, đã chuẩn hoá về góc (0,0). */
function clusterBox(cells){let w=0,h=0;for(const [x,y,s] of cells){w=Math.max(w,x+s);h=Math.max(h,y+s)}return{w,h}}
// Xoay 90° theo chiều kim đồng hồ
function rotateCells(cells){const h=clusterBox(cells).h;return cells.map(([x,y,s])=>[h-(y+s),x,s])}
function absSquares(cells,x,y){return cells.map(([dx,dy,s])=>[x+dx,y+dy,s])}
// Đặt cụm tại (x,y) có nằm trong khung N×N và không chồng lên các ô đã đặt không
function canPlace(N,placed,cells,x,y){
  for(const [dx,dy,s] of cells){
    const ax=x+dx,ay=y+dy;
    if(ax<0||ay<0||ax+s>N||ay+s>N)return false;
    for(const [qx,qy,qs] of placed)if(ax<qx+qs&&qx<ax+s&&ay<qy+qs&&qy<ay+s)return false;
  }
  return true;
}
// Hoàn chỉnh = không vượt khung, không chồng lấn, phủ kín toàn bộ N×N
function isComplete(N,squares){
  const occ=new Uint8Array(N*N);let area=0;
  for(const [x,y,s] of squares){
    if(x<0||y<0||x+s>N||y+s>N)return false;
    for(let j=y;j<y+s;j++)for(let i=x;i<x+s;i++){if(occ[j*N+i])return false;occ[j*N+i]=1}
    area+=s*s;
  }
  return area===N*N;
}
if(typeof module!=='undefined')module.exports={clusterBox,rotateCells,absSquares,canPlace,isComplete};