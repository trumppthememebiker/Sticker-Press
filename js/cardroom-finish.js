// Adapted from our Cardroom foil.js: spectral diffraction, mosaic/prism facets,
// laminate strip and metal reflections. Cutout/alpha remain the sticker engine's.
window.CardroomFinishGLSL = `
uniform vec2 uSize;
uniform vec3 uCenter;
uniform float uFinishMode,uFinishAmount;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
vec3 spectral(float nm){
 // Approximate visible spectral response with smooth lobes in linear RGB.
 float red=exp(-.5*pow((nm-615.)/32.,2.))+.16*exp(-.5*pow((nm-410.)/18.,2.));
 float green=exp(-.5*pow((nm-542.)/29.,2.));
 float blue=exp(-.5*pow((nm-452.)/24.,2.));
 return vec3(red,green,blue)*smoothstep(375.,410.,nm)*(1.-smoothstep(675.,725.,nm));
}
vec3 diffraction(vec3 L,vec3 V,vec3 T,float spacing){
 float opticalPath=abs(dot(L+V,T))*spacing;
 vec3 energy=vec3(0.);
 for(int m=1;m<=3;m++){
  float order=float(m);
  energy+=spectral(opticalPath/order)/(order*order);
 }
 return energy;
}

float reliefHeight(vec2 uv){return dot(texture(uImage,uv).rgb,vec3(.2126,.7152,.0722));}
vec3 cardroomFinish(vec3 displayArt){

  if(uFinishMode<-.5)return displayArt;
  vec2 uv=vec2(vUv.x,1.-vUv.y);
  float uAspect=uTexSize.x/uTexSize.y;
  vec3 vWorld=(vPos-uCenter)/max(uSize.y,.01)*3.9;
  vec3 vNormal=vN,vTangent=vT,vBitangent=vB;
  vec3 cameraPosition=vec3(0.,0.,7.5);
  vec3 art=pow(max(displayArt,vec3(0.)),vec3(2.2));
  float uMode=uFinishMode>9.5?2.:uFinishMode;
  float uStrength=uFinishAmount,uPattern=.20,uLight=.45,uZone=0.,uInset=0.;
  float uEmboss=uFinishMode>9.5?uFinishAmount:0.,uMetalType=2.;
  float uPaperGloss=1.,uArtGloss=1.,uDirection=.523599,uVariant=0.,uReliefSource=0.;
  vec2 uTexel=1./uTexSize;
  vec3 uLightColor=vec3(1.);
 vec3 N=normalize(vNormal),V=normalize(cameraPosition-vWorld);
 vec3 L=normalize(vec3(-2.2,3.2,6.)-vWorld);
 vec3 L2=normalize(vec3(3.,-.8,4.5)-vWorld);
 vec3 H=normalize(L+V);
 float nV=max(dot(N,V),.001),nL=max(dot(N,L),0.);
 float edgeDist=min(min(uv.x,1.-uv.x),min(uv.y,1.-uv.y));
 float zone=1.;
 float metalCoverage=uFinishMode>9.5?1.:0.;
 zone*=1.-metalCoverage*uEmboss*.9*(1.-1.);
 // Back-side border excludes diffraction only; clearcoat remains continuous.
 if(uInset>0.)zone*=smoothstep(uInset,uInset+.004,edgeDist);
 if(uZone>.5&&uZone<1.5)zone=1.-smoothstep(.055,.115,edgeDist);
 if(uZone>1.5)zone=smoothstep(.28,.73,dot(art,vec3(.2126,.7152,.0722)));
 // Ink is retained. Only light reaching the foil substrate gets dispersed.
 float ink=dot(art,vec3(.2126,.7152,.0722));
 // The light control changes reflections, never the exposure of the scan.
 vec3 color=art;
 if(uMode<.5){
  vec2 field=uv*vec2(uAspect,1.);
  float density=mix(150.,500.,uPattern);
  vec2 cell=floor(field*density);
  float grain=hash(cell);
  float macro=noise(field*4.7);
  float orientation=.4+sin(field.y*4.+field.x*3.)*.42+sin(field.x*8.-field.y*3.)*.18;
  vec3 T=normalize(cos(orientation)*vTangent+sin(orientation)*vBitangent);
  float spacing=mix(1350.,1600.,noise(field*5.3+17.));
  vec3 rainbow=diffraction(L,V,T,spacing)+.45*diffraction(L2,V,T,spacing*.91);
  // A second etched direction catches light as the first one moves out of view.
  vec3 T2=normalize(-sin(orientation+.9)*vTangent+cos(orientation+.9)*vBitangent);
  rainbow+=diffraction(L,V,T2,spacing*.87)*.2;
  float strength=uStrength*zone*1.;
  float response=(.18+.82*sqrt(ink))*(.7+uLight*.75);
  color*=1.-strength*.16;
  color+=rainbow*strength*response*.72;
  // Fine emboss glints are stable in card coordinates, never temporal noise.
  vec3 microN=normalize(N+vTangent*(hash(cell+5.)-.5)*.4+vBitangent*(hash(cell+19.)-.5)*.4);
  float glint=pow(max(dot(microN,H),0.),210.);
  float fleck=smoothstep(.55,.95,grain)*glint;
  color+=mix(vec3(.75),rainbow*1.3,.7)*fleck*strength*.12;
 }else if(uMode<1.5){
  // Irregular flakes: nearest scattered seeds form stable polygon fragments.
  // Each fragment has its own groove orientation and slightly tilted normal.
  // Keep the flake pattern anchored at the card center while its scale changes.
  vec2 field=(uv-.5)*vec2(uAspect*1.12,1.)*mix(130.,30.,uPattern);
  vec2 tile=floor(field),f=fract(field),flakeId=vec2(0.);
  float nearest=100.,second=100.;
  for(int yy=-1;yy<=1;yy++)for(int xx=-1;xx<=1;xx++){
   vec2 offset=vec2(float(xx),float(yy));
   vec2 id=tile+offset;
   vec2 seed=.12+.76*vec2(hash(id+3.1),hash(id+47.7));
   vec2 d=offset+seed-f;
   float d2=dot(d,d);
   if(d2<nearest){second=nearest;nearest=d2;flakeId=id;}
   else second=min(second,d2);
  }
  float grain=hash(flakeId+11.);
  // Voronoi cells tile the entire surface; no dark gutters or missing cells.
  // Independent orientations, not gaps, distinguish adjacent foil fragments.
  float coverage=1.;
  float orientation=hash(flakeId+91.)*6.2831853;
  vec3 T=normalize(vTangent*cos(orientation)+vBitangent*sin(orientation));
  vec3 microN=normalize(N+vTangent*(hash(flakeId+5.)-.5)*.9+vBitangent*(hash(flakeId+27.)-.5)*.9);
  float spacing=mix(1050.,1850.,hash(flakeId+61.));
  vec3 spectralLight=diffraction(L,V,T,spacing)+.65*diffraction(L2,V,T,spacing);
  spectralLight+=.4*diffraction(normalize(vec3(-3.,-2.,4.)-vWorld),V,T,spacing);
  float pixelFootprint=clamp(length(fwidth(field)),0.,1.);
  float sharpness=mix(125.,65.,pixelFootprint);
  float flash=pow(max(dot(microN,H),0.),sharpness);
  float fillFlash=pow(max(dot(microN,normalize(V+L2)),0.),sharpness)*.38;
  float reflection=flash+fillFlash;
  float amount=uStrength*zone*1.*coverage;
  float brightness=(.23+.77*sqrt(ink))*(.6+uLight*.8);
  // Foil fragments are embedded in the printed surface. Their color appears
  // only near a reflection direction rather than as permanent colored tiles.
  color*=1.-amount*.025;
  float spectralPeak=max(max(spectralLight.r,spectralLight.g),spectralLight.b);
  vec3 saturated=spectralLight/max(.4,spectralPeak);
  vec3 reflected=mix(vec3(.85),saturated*1.5,.92);
  color+=reflected*amount*brightness*reflection*1.9;
  // Keep unlit flakes transparent to the print instead of covering every cell
  // with additive pastel light. Strong flashes remain angle-dependent above.
  color+=saturated*amount*brightness*(.012+.032*sqrt(spectralPeak));
 }else if(uMode>2.5&&uMode<3.5){
  // Two stable triangular facets per grid cell, centered on the card.
  vec2 f=(uv-.5)*vec2(uAspect,1.);
  float co=cos(uDirection),si=sin(uDirection);f=mat2(co,-si,si,co)*f*mix(50.,10.,uPattern);
  vec2 tile=floor(f),local=fract(f);float triangle=step(local.y,local.x);
  float seed=hash(tile+triangle*31.7),orientation=uDirection+seed*6.2831853;
  vec3 T=normalize(vTangent*cos(orientation)+vBitangent*sin(orientation));
  vec3 facetN=normalize(N+vTangent*(hash(tile+triangle*17.)-.5)*.65+vBitangent*(hash(tile+triangle*43.)-.5)*.65);
  vec3 rainbow=diffraction(L,V,T,mix(1150.,1850.,seed))+.55*diffraction(L2,V,T,1450.);
  float glint=pow(max(dot(facetN,H),0.),65.);
  float amount=uStrength*zone*1.;
  color*=1.-amount*.045;
  color+=rainbow*amount*(.08+glint*1.5)*(.4+sqrt(ink)*.6)*(.55+uLight*.75);
  color+=vec3(1.,.98,.9)*glint*amount*.25;
 }else if(uMode>3.5&&uMode<4.5){
  vec2 f=(uv-.5)*vec2(uAspect,1.);float co=cos(uDirection),si=sin(uDirection);f=mat2(co,-si,si,co)*f;
  float density=mix(35.,180.,uPattern),warp=.035*sin(f.x*13.)+.018*sin(length(f+vec2(.17,.05))*19.);
  float phase=(f.y+warp)*density*6.2831853;
  float aa=max(fwidth(phase),.02),line=1.-smoothstep(.06,.06+aa,abs(sin(phase)));
  float orientation=uDirection+sin(f.x*13.)*.55;
  vec3 T=normalize(vTangent*cos(orientation)+vBitangent*sin(orientation));
  vec3 grooveN=normalize(N+vBitangent*sin(phase)*.22+vTangent*cos(phase+f.x*5.)*.10);
  float flash=pow(max(dot(grooveN,H),0.),70.);
  vec3 rainbow=diffraction(L,V,T,1500.)+.5*diffraction(L2,V,T,1380.);
  float amount=uStrength*zone*1.;
  color*=1.-line*amount*.075;
  color+=(rainbow*.85+vec3(.18))*line*amount*(.3+flash*1.8)*(.55+uLight*.75);
  color+=rainbow*flash*amount*.22;
 }else if(uMode>5.5&&uMode<6.5){
  vec2 f=(uv-.5)*vec2(uAspect,1.);float co=cos(uDirection),si=sin(uDirection);f=mat2(co,-si,si,co)*f;
  float phase=nV*8.+dot(V,vTangent)*5.+sin(f.y*mix(3.,12.,uPattern)+f.x*4.)*1.35;
  float blend=.5+.5*sin(phase);
  vec3 a=vec3(.23,.72,1.),b=vec3(1.,.30,.68);
  if(uVariant>.5&&uVariant<1.5){a=vec3(1.,.73,.27);b=vec3(.30,.88,.58);}
  if(uVariant>1.5){a=vec3(.82,.91,1.);b=vec3(.64,.40,.95);}
  vec3 pearl=mix(a,b,blend);
  float amount=uStrength*zone*1.;
  float sheen=(.12+.40*pow(1.-nV,1.3)+.18*pow(max(dot(N,H),0.),12.))*(.6+uLight*.65);
  color=mix(color,color*.92+pearl*sheen,amount);
  float pearlRibbon=exp(-pow((dot(V,vTangent)+f.y*.6+sin(f.x*5.)*.06)/.22,2.));
  color+=pearl*pearlRibbon*amount*.18;
 }else if(uMode>6.5&&uMode<7.5){
  vec2 stepUV=uTexel*mix(2.,10.,uPattern);
  float gx=reliefHeight(uv+vec2(stepUV.x,0.))-reliefHeight(uv-vec2(stepUV.x,0.));
  float gy=reliefHeight(uv+vec2(0.,stepUV.y))-reliefHeight(uv-vec2(0.,stepUV.y));
  float signHeight=uVariant>.5?-1.:1.;
  float depth=mix(2.,20.,uPattern)*signHeight;
  vec3 raised=normalize(N-vTangent*gx*depth-vBitangent*gy*depth);
  float surface=uReliefSource>1.5?metalCoverage:1.;
  float amount=uStrength*surface;
  float shading=clamp(dot(raised,L)-dot(N,L),-.7,.7);
  color*=1.+shading*amount*.9;
  float reliefShadow=max(0.,reliefHeight(uv+vec2(.003,.004)*signHeight)-reliefHeight(uv));
  color*=1.-reliefShadow*amount*.7;
  color+=vec3(.45,.52,.60)*max(0.,shading)*amount*.55;
  float spec=pow(max(dot(raised,H),0.),100.);
  float baseSpec=pow(max(dot(N,H),0.),100.);
  color+=vec3(.88,.94,1.)*max(0.,spec-baseSpec)*amount*.75;
 }else if(uMode>7.5){
  vec2 f=(uv-.5)*vec2(uAspect,1.);float co=cos(uDirection),si=sin(uDirection);f=mat2(co,-si,si,co)*f*mix(32.,8.,uPattern);
  vec2 tile=floor(f),local=fract(f)-.5;float radial=length(local),angle=atan(local.y,local.x);
  float aa=max(length(fwidth(local)),.005),glyph;
  if(uVariant<.5){float radius=.20+.10*cos(angle*5.);glyph=1.-smoothstep(radius-aa,radius+aa,radial);}
  else if(uVariant<1.5)glyph=1.-smoothstep(.02,.02+aa,abs(radial-.25));
  else{float hex=radial*cos(mod(angle+3.14159265/6.,3.14159265/3.)-3.14159265/6.);glyph=1.-smoothstep(.017,.017+aa,abs(hex-.24));}
  float orientation=uDirection+hash(tile)*2.;vec3 T=normalize(vTangent*cos(orientation)+vBitangent*sin(orientation));
  vec3 rainbow=diffraction(L,V,T,1550.)+.5*diffraction(L2,V,T,1400.);
  vec3 glyphN=normalize(N+vTangent*sin(tile.y*1.7)*.18+vBitangent*cos(tile.x*1.3)*.18);
  float reflected=pow(max(dot(glyphN,H),0.),45.);
  float amount=uStrength*zone*1.*glyph;
  color+=(rainbow+.18)*amount*reflected*2.3*(.55+uLight*.75);
 }
 {
  // Small, smooth slopes of a laminated card. This field is fixed to the
  // card, so the same ripples bend the reflection consistently on every tilt.
  // Only the coating normal changes; printed art remains perfectly legible.
  vec2 q=uv*vec2(uAspect,1.);
  float a=q.x*9.+q.y*5.;
  float b=q.y*13.-q.x*3.;
  float c=q.x*18.+q.y*11.;
  vec2 slope=vec2(
   .023*cos(a)-.012*cos(b)+.008*cos(c),
   .017*cos(a)+.026*cos(b)+.006*cos(c)
  );
  vec3 coatN=normalize(N+vTangent*slope.x+vBitangent*slope.y);
  vec3 ray=reflect(-V,coatN);
  float coatNV=max(dot(coatN,V),.001);
  float fresnel=.04+.96*pow(1.-coatNV,5.);
  if(ray.z>.001){
   float travel=(6.-vWorld.z)/ray.z;
   vec2 hit=(vWorld+ray*travel).xy-vec2(-2.,2.5);
   hit=mat2(.94,-.342,.342,.94)*hit;
   // A feathered, tapered luminous strip has no visible rectangular corners.
   float taper=sqrt(max(.05,1.-pow(clamp(abs(hit.y)/2.4,0.,1.),2.)));
   float width=uMode>4.5&&uMode<5.5?mix(.35,1.25,uPattern):1.;
   float crossSection=abs(hit.x)/((.32*taper+.10)*width);
   float across=1.-smoothstep(.30,1.32,crossSection);
   float ends=1.-smoothstep(1.15,2.45,abs(hit.y));
   float reflection=across*ends;
   // The paper finish controls only the uncoated print. The illustration's
   // selective varnish and the independent metal layer retain their response.
   float coating=max(uPaperGloss,1.*uArtGloss);
   if(uMode>4.5&&uMode<5.5)coating=1.*uArtGloss*uStrength*2.5;
   float irregularity=.85+.10*sin(q.y*17.+q.x*7.)+.05*sin(q.x*23.-q.y*9.);
   float printProtection=.22+.78*sqrt(ink);
   color+=vec3(1.,.985,.96)*reflection*irregularity*(.20+uLight*.34)*(.48+fresnel)*printProtection*coating;
   if(uMode>1.5&&uMode<2.5){
    // Clear laminate: a faint thin-film tint restricted to the reflection.
    // No diffraction bands or foil grain across the printed image.
    float phase=coatNV*9.+sin(q.y*4.+q.x*3.)*.45;
    vec3 film=.5+.5*cos(vec3(0.,2.094,4.189)+phase);
    float tint=uStrength*zone*1.;
    color+=film*reflection*irregularity*tint*.075*(.4+uLight*.6)*coating;
   }
  }
 }
 if(uEmboss>.001&&metalCoverage>.002){
  // A shallow bevel normal estimated from the metal mask gives the printed
  // stamping an edge response. It is a shading relief, not recovered geometry.
  vec2 mt=vec2(1./768.,1./1072.);
  float gx=0.;
  float gy=0.;
  vec3 metalN=normalize(N-vTangent*gx*.42-vBitangent*gy*.42);
  vec3 reflectedRay=reflect(-V,metalN);
  float gold=step(art.b*1.18,art.g)*step(art.b*1.30,art.r);
  if(uMetalType>.5)gold=uMetalType>1.5&&uMetalType<2.5?0.:1.;
  vec3 metalTint=mix(vec3(.86,.90,.95),vec3(1.,.63,.19),gold);
  if(uMetalType>2.5&&uMetalType<3.5)metalTint=vec3(1.,.38,.16);
  if(uMetalType>3.5)metalTint=vec3(1.,.58,.48);
  float strip=0.;
  if(reflectedRay.z>.01){
   vec2 hit=(vWorld+reflectedRay*((6.-vWorld.z)/reflectedRay.z)).xy;
   strip=exp(-pow((hit.x+1.9+hit.y*.27)/.72,2.))*(1.-smoothstep(2.,5.,abs(hit.y-1.2)));
   strip+=.45*exp(-pow((hit.x-2.4-hit.y*.18)/.32,2.));
  }
  float spec=pow(max(dot(metalN,H),0.),100.)+pow(max(dot(metalN,normalize(V+L2)),0.),155.)*.65;
  float grazing=pow(1.-max(dot(metalN,V),0.),4.);
  float lightEnergy=.45+uLight*.9;
  float amount=metalCoverage*uEmboss;
  vec3 metalBase=art*(.62+.25*max(dot(metalN,L),0.));
  color=mix(color,metalBase,amount*.7);
  color+=metalTint*amount*lightEnergy*(strip*1.45+spec*1.8+grazing*.18);
 }
 // Compress only added reflected light. Never tone-map the original print:
 // doing so lowers contrast even where the coating contributes no light.
 vec3 added=max(color-art,vec3(0.));
 // Tint reflected illumination while preserving the scanned print.
 color=min(color,art)+(added/(vec3(1.)+added*.55))*uLightColor;

 return clamp(pow(max(color,vec3(0.)),vec3(1./2.2)),0.,1.);
}
`;
