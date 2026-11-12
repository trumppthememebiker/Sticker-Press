// Internet finish collection, adapted from MIT-licensed Three.js and glsl-halftone.
// Upstream snapshots and full license notices are retained under vendor/.
window.InternetFinishGLSL = `
#define PI 3.141592653589793
#define RECIPROCAL_PI 0.3183098861837907
float pow2(float a){return a*a;}
vec3 pow2(vec3 a){return a*a;}
float F_Schlick(float f0,float f90,float x){return f0+(f90-f0)*pow(1.-clamp(x,0.,1.),5.);}
vec3 F_Schlick(vec3 f0,float f90,float x){return f0+(vec3(f90)-f0)*pow(1.-clamp(x,0.,1.),5.);}
float aastep(float threshold,float value){float aa=max(.0001,.7*length(vec2(dFdx(value),dFdy(value))));return smoothstep(threshold-aa,threshold+aa,value);}




	// XYZ to linear-sRGB color space
	const mat3 XYZ_TO_REC709 = mat3(
		 3.2404542, -0.9692660,  0.0556434,
		-1.5371385,  1.8760108, -0.2040259,
		-0.4985314,  0.0415560,  1.0572252
	);

	// Assume air interface for top
	// Note: We don't handle the case fresnel0 == 1
	vec3 Fresnel0ToIor( vec3 fresnel0 ) {

		vec3 sqrtF0 = sqrt( fresnel0 );
		return ( vec3( 1.0 ) + sqrtF0 ) / ( vec3( 1.0 ) - sqrtF0 );

	}

	// Conversion FO/IOR
	vec3 IorToFresnel0( vec3 transmittedIor, float incidentIor ) {

		return pow2( ( transmittedIor - vec3( incidentIor ) ) / ( transmittedIor + vec3( incidentIor ) ) );

	}

	// ior is a value between 1.0 and 3.0. 1.0 is air interface
	float IorToFresnel0( float transmittedIor, float incidentIor ) {

		return pow2( ( transmittedIor - incidentIor ) / ( transmittedIor + incidentIor ));

	}

	// Fresnel equations for dielectric/dielectric interfaces.
	// Ref: https://belcour.github.io/blog/research/publication/2017/05/01/brdf-thin-film.html
	// Evaluation XYZ sensitivity curves in Fourier space
	vec3 evalSensitivity( float OPD, vec3 shift ) {

		float phase = 2.0 * PI * OPD * 1.0e-9;
		vec3 val = vec3( 5.4856e-13, 4.4201e-13, 5.2481e-13 );
		vec3 pos = vec3( 1.6810e+06, 1.7953e+06, 2.2084e+06 );
		vec3 var = vec3( 4.3278e+09, 9.3046e+09, 6.6121e+09 );

		vec3 xyz = val * sqrt( 2.0 * PI * var ) * cos( pos * phase + shift ) * exp( - pow2( phase ) * var );
		xyz.x += 9.7470e-14 * sqrt( 2.0 * PI * 4.5282e+09 ) * cos( 2.2399e+06 * phase + shift[ 0 ] ) * exp( - 4.5282e+09 * pow2( phase ) );
		xyz /= 1.0685e-7;

		vec3 rgb = XYZ_TO_REC709 * xyz;
		return rgb;

	}

	vec3 evalIridescence( float outsideIOR, float eta2, float cosTheta1, float thinFilmThickness, vec3 baseF0 ) {

		vec3 I;

		// Force iridescenceIOR -> outsideIOR when thinFilmThickness -> 0.0
		float iridescenceIOR = mix( outsideIOR, eta2, smoothstep( 0.0, 0.03, thinFilmThickness ) );
		// Evaluate the cosTheta on the base layer (Snell law)
		float sinTheta2Sq = pow2( outsideIOR / iridescenceIOR ) * ( 1.0 - pow2( cosTheta1 ) );

		// Handle TIR:
		float cosTheta2Sq = 1.0 - sinTheta2Sq;
		if ( cosTheta2Sq < 0.0 ) {

			return vec3( 1.0 );

		}

		float cosTheta2 = sqrt( cosTheta2Sq );

		// First interface
		float R0 = IorToFresnel0( iridescenceIOR, outsideIOR );
		float R12 = F_Schlick( R0, 1.0, cosTheta1 );
		float T121 = 1.0 - R12;
		float phi12 = 0.0;
		if ( iridescenceIOR < outsideIOR ) phi12 = PI;
		float phi21 = PI - phi12;

		// Second interface
		vec3 baseIOR = Fresnel0ToIor( clamp( baseF0, 0.0, 0.9999 ) ); // guard against 1.0
		vec3 R1 = IorToFresnel0( baseIOR, iridescenceIOR );
		vec3 R23 = F_Schlick( R1, 1.0, cosTheta2 );
		vec3 phi23 = vec3( 0.0 );
		if ( baseIOR[ 0 ] < iridescenceIOR ) phi23[ 0 ] = PI;
		if ( baseIOR[ 1 ] < iridescenceIOR ) phi23[ 1 ] = PI;
		if ( baseIOR[ 2 ] < iridescenceIOR ) phi23[ 2 ] = PI;

		// Phase shift
		float OPD = 2.0 * iridescenceIOR * thinFilmThickness * cosTheta2;
		vec3 phi = vec3( phi21 ) + phi23;

		// Compound terms
		vec3 R123 = clamp( R12 * R23, 1e-5, 0.9999 );
		vec3 r123 = sqrt( R123 );
		vec3 Rs = pow2( T121 ) * R23 / ( vec3( 1.0 ) - R123 );

		// Reflectance term for m = 0 (DC term amplitude)
		vec3 C0 = R12 + Rs;
		I = C0;

		// Reflectance term for m > 0 (pairs of diracs)
		vec3 Cm = Rs - T121;
		for ( int m = 1; m <= 2; ++ m ) {

			Cm *= r123;
			vec3 Sm = 2.0 * evalSensitivity( float( m ) * OPD, float( m ) * phi );
			I += Cm * Sm;

		}

		// Since out of gamut colors might be produced, negative color values are clamped to 0.
		return max( I, vec3( 0.0 ) );

	}



	float D_GGX_Anisotropic( const in float alphaT, const in float alphaB, const in float dotNH, const in float dotTH, const in float dotBH ) {

		float a2 = alphaT * alphaB;
		highp vec3 v = vec3( alphaB * dotTH, alphaT * dotBH, a2 * dotNH );
		highp float v2 = dot( v, v );
		float w2 = a2 / v2;

		return RECIPROCAL_PI * a2 * pow2 ( w2 );

	}

vec3 halftone(vec3 texcolor, vec2 st, float frequency) {
  float n = 0.0; // Smooth paper: omit upstream fractal noise.
  vec3 white = vec3(n*0.2 + 0.97);
  vec3 black = vec3(n + 0.1);

  // Perform a rough RGB-to-CMYK conversion
  vec4 cmyk;
  cmyk.xyz = 1.0 - texcolor;
  cmyk.w = min(cmyk.x, min(cmyk.y, cmyk.z)); // Create K
  cmyk.xyz -= cmyk.w; // Subtract K equivalent from CMY

  // Distance to nearest point in a grid of
  // (frequency x frequency) points over the unit square
  vec2 Kst = frequency*mat2(0.707, -0.707, 0.707, 0.707)*st;
  vec2 Kuv = 2.0*fract(Kst)-1.0;
  float k = aastep(0.0, sqrt(cmyk.w)-length(Kuv)+n);
  vec2 Cst = frequency*mat2(0.966, -0.259, 0.259, 0.966)*st;
  vec2 Cuv = 2.0*fract(Cst)-1.0;
  float c = aastep(0.0, sqrt(cmyk.x)-length(Cuv)+n);
  vec2 Mst = frequency*mat2(0.966, 0.259, -0.259, 0.966)*st;
  vec2 Muv = 2.0*fract(Mst)-1.0;
  float m = aastep(0.0, sqrt(cmyk.y)-length(Muv)+n);
  vec2 Yst = frequency*st; // 0 deg
  vec2 Yuv = 2.0*fract(Yst)-1.0;
  float y = aastep(0.0, sqrt(cmyk.z)-length(Yuv)+n);

  vec3 rgbscreen = 1.0 - 0.9*vec3(c,m,y) + n;
  return mix(rgbscreen, black, 0.85*k + 0.3*n);
}

vec3 halftone(vec3 texcolor, vec2 st) {
  return halftone(texcolor, st, 30.0);
}

vec3 internetFinish(vec3 printColor){
 vec2 uv=vec2(vUv.x,1.-vUv.y);
 vec3 world=(vPos-uCenter)/max(uSize.y,.01)*3.9;
 vec3 N=normalize(vN),V=normalize(vec3(0.,0.,7.5)-world);
 vec3 L=normalize(vec3(-2.2,3.2,6.)-world),H=normalize(L+V);
 vec3 art=pow(max(printColor,vec3(0.)),vec3(2.2));
 float amount=uFinishAmount;
 vec3 color=art;
 if(uFinishMode<20.5){
  // Three.js thin-film interference; smooth varying film thickness, no bump map.
  float thickness=470.+135.*sin(uv.y*5.+uv.x*3.)+65.*sin(uv.x*7.-uv.y*4.);
  vec3 film=evalIridescence(1.,1.46,max(dot(N,H),.01),thickness,vec3(.20));
  float coat=.2+.8*pow(max(dot(N,H),0.),18.);
  color=art*(1.-amount*.04)+film*amount*(.45+coat*.8);
 }else if(uFinishMode<21.5){
  // Three.js anisotropic GGX NDF: tangent-aligned elongated metal reflection.
  float d=D_GGX_Anisotropic(.38,.055,max(dot(N,H),.001),dot(vT,H),dot(vB,H));
  float reflection=d/(d+2.);
  vec3 gold=vec3(1.,.71,.25);
  float lum=dot(art,vec3(.2126,.7152,.0722));
  vec3 printedGold=mix(art,vec3(lum)*gold,amount*.55);
  color=printedGold*(1.-amount*.12)+gold*reflection*amount*1.3;
 }else{
  // CMYK halftone screen from glsl-halftone. Ink is flat; no surface deformation.
  vec2 field=(uv-.5)*vec2(uTexSize.x/uTexSize.y,1.);
  vec3 printed=halftone(printColor,field,155.);
  printed*=vec3(1.,.975,.91);
  return clamp(mix(printColor,printed,amount*texture(uImage,vUv).a),0.,1.);
 }
 // Compress reflected energy only, preserving photographic print contrast.
 vec3 added=max(color-art,vec3(0.));
 color=min(color,art)+added/(1.+added*.55);
 return clamp(pow(max(color,vec3(0.)),vec3(1./2.2)),0.,1.);
}
`;
