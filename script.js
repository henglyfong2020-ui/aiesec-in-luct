// scroll-aware header: adds background past hero, hides on scroll-down, reveals on scroll-up
  const siteHeader = document.getElementById('siteHeader');
  let lastY = window.scrollY;
  window.addEventListener('scroll', () => {
    // while the mobile menu is open, the background page is locked via
    // body{position:fixed}, and setting that alone can make the browser fire
    // a scroll event with scrollY reset to 0 as a side effect — ignore scroll
    // events entirely during that lock so the header's white/transparent
    // state doesn't get wiped out by that phantom event
    if(document.body.classList.contains('menu-open')) return;
    const y = window.scrollY;
    siteHeader.classList.toggle('scrolled', y > 60);
    if(y > lastY && y > 160){
      siteHeader.classList.add('hide-nav');
    } else {
      siteHeader.classList.remove('hide-nav');
    }
    lastY = y;
  }, { passive:true });

  // mobile menu
  const hamburgerBtn = document.getElementById('hamburgerBtn');
  const mobileMenu = document.getElementById('mobileMenu');
  let savedScrollY = 0;

  function openMobileMenu(){
    savedScrollY = window.scrollY;
    // keep the header in its light "scrolled" look while the menu is open,
    // so the hamburger icon stays visible against the white panel behind it,
    // and so the menu's fixed top offset always matches the header's height
    siteHeader.classList.add('scrolled');
    // lock the background page in place — position:fixed at the exact scroll
    // offset is the reliable cross-browser way to stop scrolling (including
    // iOS Safari, where overflow:hidden alone doesn't fully block touch-scroll)
    document.body.style.top = `-${savedScrollY}px`;
    document.body.classList.add('menu-open');
    mobileMenu.classList.add('open');
    hamburgerBtn.classList.add('open');
  }

  function closeMobileMenu(){
    mobileMenu.classList.remove('open');
    hamburgerBtn.classList.remove('open');
    document.body.classList.remove('menu-open');
    document.body.style.top = '';
    // restore the exact scroll position, instantly (no smooth animation) so
    // the page doesn't visibly jump/animate back into place — explicitly
    // forcing "instant" here because the site's global scroll-behavior:smooth
    // (used for anchor links) would otherwise animate this too
    window.scrollTo({ top: savedScrollY, left: 0, behavior: 'instant' });
    siteHeader.classList.toggle('scrolled', savedScrollY > 60);
  }

  hamburgerBtn.addEventListener('click', () => {
    if(mobileMenu.classList.contains('open')){
      closeMobileMenu();
    } else {
      openMobileMenu();
    }
  });
  document.querySelectorAll('.mnav').forEach(a => a.addEventListener('click', closeMobileMenu));

  // scroll reveal
  const revealEls = document.querySelectorAll('.reveal');
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => { if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { threshold: 0.15 });
  revealEls.forEach(el => io.observe(el));

  // animated counters
  const counters = document.querySelectorAll('[data-count]');
  const cio = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if(entry.isIntersecting){
        const el = entry.target;
        const target = parseInt(el.getAttribute('data-count'), 10);
        const duration = 1400;
        const start = performance.now();
        function tick(now){
          const p = Math.min((now - start) / duration, 1);
          const eased = 1 - Math.pow(1 - p, 3);
          el.textContent = Math.floor(eased * target).toLocaleString() + (p >= 1 ? '+' : '');
          if(p < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
        cio.unobserve(el);
      }
    });
  }, { threshold: 0.4 });
  counters.forEach(el => cio.observe(el));

  // FAQ accordion
  document.querySelectorAll('.faq-q').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.parentElement;
      const wasOpen = item.classList.contains('open');
      document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'));
      if(!wasOpen) item.classList.add('open');
    });
  });

  // stories tabs — sliding orange underline (hover preview + active position) and a smooth
  // crossfade/slide-up transition between story panels instead of an abrupt switch
  const storyCatsWrap = document.querySelector('.story-cats');
  const storyCatsIndicator = document.getElementById('storyCatsIndicator');
  const storyCatsButtons = document.querySelectorAll('.story-cats button');
  const PANEL_TRANSITION_MS = 300;

  function moveIndicatorTo(btn){
    if(!storyCatsIndicator || !btn) return;
    storyCatsIndicator.style.left = btn.offsetLeft + 'px';
    storyCatsIndicator.style.width = btn.offsetWidth + 'px';
  }
  function moveIndicatorToActive(){
    moveIndicatorTo(document.querySelector('.story-cats button.active'));
  }

  function switchStoryPanel(targetPanel){
    const currentPanel = document.querySelector('.story-panel.active');
    if(!targetPanel || targetPanel === currentPanel) return;

    function revealTarget(){
      targetPanel.classList.add('active');
      // force a reflow so the opacity/transform transition actually triggers
      void targetPanel.offsetWidth;
      requestAnimationFrame(() => targetPanel.classList.add('visible'));
    }

    if(currentPanel){
      currentPanel.classList.remove('visible');
      setTimeout(() => {
        currentPanel.classList.remove('active');
        revealTarget();
      }, PANEL_TRANSITION_MS);
    } else {
      revealTarget();
    }
  }

  storyCatsButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.story-cats button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      moveIndicatorTo(btn);
      switchStoryPanel(document.querySelector(`.story-panel[data-panel="${btn.dataset.cat}"]`));
    });
    btn.addEventListener('mouseenter', () => moveIndicatorTo(btn));
  });
  if(storyCatsWrap){
    storyCatsWrap.addEventListener('mouseleave', moveIndicatorToActive);
  }
  window.addEventListener('load', moveIndicatorToActive);
  window.addEventListener('resize', moveIndicatorToActive);
  moveIndicatorToActive();

  // ---- auto-scroll carousels (Local Committee Team photo + past-event mini galleries) ----
  function initCarousel(container, intervalMs){
    const slides = container.querySelectorAll('.carousel-slide');
    if(slides.length <= 1) return;
    let i = 0;
    setInterval(() => {
      slides[i].classList.remove('active');
      i = (i + 1) % slides.length;
      slides[i].classList.add('active');
      const dotsWrap = container.querySelector('.carousel-dots');
      if(dotsWrap){
        dotsWrap.querySelectorAll('span').forEach((d, di) => d.classList.toggle('active', di === i));
      }
    }, intervalMs);
  }

  // Local Committee Team — single large carousel with dot indicators
  const lcCarousel = document.getElementById('lcCarousel');
  if(lcCarousel){
    const dotsWrap = document.getElementById('lcCarouselDots');
    const slideCount = lcCarousel.querySelectorAll('.carousel-slide').length;
    for(let d = 0; d < slideCount; d++){
      const dot = document.createElement('span');
      if(d === 0) dot.classList.add('active');
      dotsWrap.appendChild(dot);
    }
    initCarousel(lcCarousel, 3500);
  }

  // Past-event mini carousels — each card cycles its own photos automatically
  document.querySelectorAll('.mini-carousel').forEach(el => initCarousel(el, 2800));

  // ---- Featured upcoming event: Register button on/off switch ----
  // Set this to false to hide the Register button on the featured event.
  const SHOW_REGISTER_BUTTON = true;
  const eventRegisterBtn = document.getElementById('eventRegisterBtn');
  if(eventRegisterBtn && !SHOW_REGISTER_BUTTON){
    eventRegisterBtn.style.display = 'none';
  }

  // ---- Contact form: route to the right inbox based on Interest, without exposing addresses in the page source ----
  const CF_ROUTES = {
    membership: 'bWFyYWR5LnJvdTFAYWllc2VjLm5ldA==',
    exchange: 'bW9uaXJvc2EudG9AYWllc2VjLm5ldCx2YW5ueWRlbi5uaW0xQGFpZXNlYy5uZXQ=',
    partnership: 'a2ltc3Vhci50cnlAYWllc2VjLm5ldA==',
    events: 'bW9ueXJldGguY2hob3JkYTFAYWllc2VjLm5ldA==',
    other: 'bHlmb25nLmhlbmdAYWllc2VjLm5ldA=='
  };
  const contactForm = document.getElementById('contactForm');
  if(contactForm){
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('cf-name').value.trim();
      const email = document.getElementById('cf-email').value.trim();
      const interest = document.getElementById('cf-interest').value;
      const message = document.getElementById('cf-message').value.trim();
      const to = atob(CF_ROUTES[interest] || CF_ROUTES.other);
      const subject = encodeURIComponent(`AIESEC in LUCT — ${document.getElementById('cf-interest').selectedOptions[0].text} Inquiry`);
      const body = encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\n${message}`);
      window.location.href = `mailto:${to}?subject=${subject}&body=${body}`;
    });
  }

  // ---- Global Reach world map ----
  // To add, remove, or rename a country, edit ONLY this list — the legend chips
  // and the map pins are both generated from it automatically, so nothing else
  // needs to change. Names must be spelled the way they appear in COUNTRY_COORDS
  // below (common name, case-insensitive) — e.g. "Vietnam", "United States", "UK".
  const EXCHANGE_COUNTRIES = [
    "Vietnam", "Indonesia", "India", "Malaysia",
    "Philippines", "Cambodia", "Sri Lanka", "Singapore"
  ];

  // Name -> { code, lat, lon } lookup for ~244 countries/territories. You shouldn't
  // need to touch this — it's only here so EXCHANGE_COUNTRIES can be looked up by name.
  const COUNTRY_COORDS = {"andorra":{"code":"AD","lat":42.546245,"lon":1.601554},"united arab emirates":{"code":"AE","lat":23.424076,"lon":53.847818},"afghanistan":{"code":"AF","lat":33.93911,"lon":67.709953},"antigua and barbuda":{"code":"AG","lat":17.060816,"lon":-61.796428},"anguilla":{"code":"AI","lat":18.220554,"lon":-63.068615},"albania":{"code":"AL","lat":41.153332,"lon":20.168331},"armenia":{"code":"AM","lat":40.069099,"lon":45.038189},"netherlands antilles":{"code":"AN","lat":12.226079,"lon":-69.060087},"angola":{"code":"AO","lat":-11.202692,"lon":17.873887},"antarctica":{"code":"AQ","lat":-75.250973,"lon":-0.071389},"argentina":{"code":"AR","lat":-38.416097,"lon":-63.616672},"american samoa":{"code":"AS","lat":-14.270972,"lon":-170.132217},"austria":{"code":"AT","lat":47.516231,"lon":14.550072},"australia":{"code":"AU","lat":-25.274398,"lon":133.775136},"aruba":{"code":"AW","lat":12.52111,"lon":-69.968338},"azerbaijan":{"code":"AZ","lat":40.143105,"lon":47.576927},"bosnia and herzegovina":{"code":"BA","lat":43.915886,"lon":17.679076},"barbados":{"code":"BB","lat":13.193887,"lon":-59.543198},"bangladesh":{"code":"BD","lat":23.684994,"lon":90.356331},"belgium":{"code":"BE","lat":50.503887,"lon":4.469936},"burkina faso":{"code":"BF","lat":12.238333,"lon":-1.561593},"bulgaria":{"code":"BG","lat":42.733883,"lon":25.48583},"bahrain":{"code":"BH","lat":25.930414,"lon":50.637772},"burundi":{"code":"BI","lat":-3.373056,"lon":29.918886},"benin":{"code":"BJ","lat":9.30769,"lon":2.315834},"bermuda":{"code":"BM","lat":32.321384,"lon":-64.75737},"brunei":{"code":"BN","lat":4.535277,"lon":114.727669},"bolivia":{"code":"BO","lat":-16.290154,"lon":-63.588653},"brazil":{"code":"BR","lat":-14.235004,"lon":-51.92528},"bahamas":{"code":"BS","lat":25.03428,"lon":-77.39628},"bhutan":{"code":"BT","lat":27.514162,"lon":90.433601},"bouvet island":{"code":"BV","lat":-54.423199,"lon":3.413194},"botswana":{"code":"BW","lat":-22.328474,"lon":24.684866},"belarus":{"code":"BY","lat":53.709807,"lon":27.953389},"belize":{"code":"BZ","lat":17.189877,"lon":-88.49765},"canada":{"code":"CA","lat":56.130366,"lon":-106.346771},"cocos [keeling] islands":{"code":"CC","lat":-12.164165,"lon":96.870956},"congo [drc]":{"code":"CD","lat":-4.038333,"lon":21.758664},"central african republic":{"code":"CF","lat":6.611111,"lon":20.939444},"congo [republic]":{"code":"CG","lat":-0.228021,"lon":15.827659},"switzerland":{"code":"CH","lat":46.818188,"lon":8.227512},"c\u00f4te d'ivoire":{"code":"CI","lat":7.539989,"lon":-5.54708},"cook islands":{"code":"CK","lat":-21.236736,"lon":-159.777671},"chile":{"code":"CL","lat":-35.675147,"lon":-71.542969},"cameroon":{"code":"CM","lat":7.369722,"lon":12.354722},"china":{"code":"CN","lat":35.86166,"lon":104.195397},"colombia":{"code":"CO","lat":4.570868,"lon":-74.297333},"costa rica":{"code":"CR","lat":9.748917,"lon":-83.753428},"cuba":{"code":"CU","lat":21.521757,"lon":-77.781167},"cape verde":{"code":"CV","lat":16.002082,"lon":-24.013197},"christmas island":{"code":"CX","lat":-10.447525,"lon":105.690449},"cyprus":{"code":"CY","lat":35.126413,"lon":33.429859},"czech republic":{"code":"CZ","lat":49.817492,"lon":15.472962},"germany":{"code":"DE","lat":51.165691,"lon":10.451526},"djibouti":{"code":"DJ","lat":11.825138,"lon":42.590275},"denmark":{"code":"DK","lat":56.26392,"lon":9.501785},"dominica":{"code":"DM","lat":15.414999,"lon":-61.370976},"dominican republic":{"code":"DO","lat":18.735693,"lon":-70.162651},"algeria":{"code":"DZ","lat":28.033886,"lon":1.659626},"ecuador":{"code":"EC","lat":-1.831239,"lon":-78.183406},"estonia":{"code":"EE","lat":58.595272,"lon":25.013607},"egypt":{"code":"EG","lat":26.820553,"lon":30.802498},"western sahara":{"code":"EH","lat":24.215527,"lon":-12.885834},"eritrea":{"code":"ER","lat":15.179384,"lon":39.782334},"spain":{"code":"ES","lat":40.463667,"lon":-3.74922},"ethiopia":{"code":"ET","lat":9.145,"lon":40.489673},"finland":{"code":"FI","lat":61.92411,"lon":25.748151},"fiji":{"code":"FJ","lat":-16.578193,"lon":179.414413},"falkland islands [islas malvinas]":{"code":"FK","lat":-51.796253,"lon":-59.523613},"micronesia":{"code":"FM","lat":7.425554,"lon":150.550812},"faroe islands":{"code":"FO","lat":61.892635,"lon":-6.911806},"france":{"code":"FR","lat":46.227638,"lon":2.213749},"gabon":{"code":"GA","lat":-0.803689,"lon":11.609444},"united kingdom":{"code":"GB","lat":55.378051,"lon":-3.435973},"grenada":{"code":"GD","lat":12.262776,"lon":-61.604171},"georgia":{"code":"GE","lat":42.315407,"lon":43.356892},"french guiana":{"code":"GF","lat":3.933889,"lon":-53.125782},"guernsey":{"code":"GG","lat":49.465691,"lon":-2.585278},"ghana":{"code":"GH","lat":7.946527,"lon":-1.023194},"gibraltar":{"code":"GI","lat":36.137741,"lon":-5.345374},"greenland":{"code":"GL","lat":71.706936,"lon":-42.604303},"gambia":{"code":"GM","lat":13.443182,"lon":-15.310139},"guinea":{"code":"GN","lat":9.945587,"lon":-9.696645},"guadeloupe":{"code":"GP","lat":16.995971,"lon":-62.067641},"equatorial guinea":{"code":"GQ","lat":1.650801,"lon":10.267895},"greece":{"code":"GR","lat":39.074208,"lon":21.824312},"south georgia and the south sandwich islands":{"code":"GS","lat":-54.429579,"lon":-36.587909},"guatemala":{"code":"GT","lat":15.783471,"lon":-90.230759},"guam":{"code":"GU","lat":13.444304,"lon":144.793731},"guinea-bissau":{"code":"GW","lat":11.803749,"lon":-15.180413},"guyana":{"code":"GY","lat":4.860416,"lon":-58.93018},"gaza strip":{"code":"GZ","lat":31.354676,"lon":34.308825},"hong kong":{"code":"HK","lat":22.396428,"lon":114.109497},"heard island and mcdonald islands":{"code":"HM","lat":-53.08181,"lon":73.504158},"honduras":{"code":"HN","lat":15.199999,"lon":-86.241905},"croatia":{"code":"HR","lat":45.1,"lon":15.2},"haiti":{"code":"HT","lat":18.971187,"lon":-72.285215},"hungary":{"code":"HU","lat":47.162494,"lon":19.503304},"indonesia":{"code":"ID","lat":-0.789275,"lon":113.921327},"ireland":{"code":"IE","lat":53.41291,"lon":-8.24389},"israel":{"code":"IL","lat":31.046051,"lon":34.851612},"isle of man":{"code":"IM","lat":54.236107,"lon":-4.548056},"india":{"code":"IN","lat":20.593684,"lon":78.96288},"british indian ocean territory":{"code":"IO","lat":-6.343194,"lon":71.876519},"iraq":{"code":"IQ","lat":33.223191,"lon":43.679291},"iran":{"code":"IR","lat":32.427908,"lon":53.688046},"iceland":{"code":"IS","lat":64.963051,"lon":-19.020835},"italy":{"code":"IT","lat":41.87194,"lon":12.56738},"jersey":{"code":"JE","lat":49.214439,"lon":-2.13125},"jamaica":{"code":"JM","lat":18.109581,"lon":-77.297508},"jordan":{"code":"JO","lat":30.585164,"lon":36.238414},"japan":{"code":"JP","lat":36.204824,"lon":138.252924},"kenya":{"code":"KE","lat":-0.023559,"lon":37.906193},"kyrgyzstan":{"code":"KG","lat":41.20438,"lon":74.766098},"cambodia":{"code":"KH","lat":12.565679,"lon":104.990963},"kiribati":{"code":"KI","lat":-3.370417,"lon":-168.734039},"comoros":{"code":"KM","lat":-11.875001,"lon":43.872219},"saint kitts and nevis":{"code":"KN","lat":17.357822,"lon":-62.782998},"north korea":{"code":"KP","lat":40.339852,"lon":127.510093},"south korea":{"code":"KR","lat":35.907757,"lon":127.766922},"kuwait":{"code":"KW","lat":29.31166,"lon":47.481766},"cayman islands":{"code":"KY","lat":19.513469,"lon":-80.566956},"kazakhstan":{"code":"KZ","lat":48.019573,"lon":66.923684},"laos":{"code":"LA","lat":19.85627,"lon":102.495496},"lebanon":{"code":"LB","lat":33.854721,"lon":35.862285},"saint lucia":{"code":"LC","lat":13.909444,"lon":-60.978893},"liechtenstein":{"code":"LI","lat":47.166,"lon":9.555373},"sri lanka":{"code":"LK","lat":7.873054,"lon":80.771797},"liberia":{"code":"LR","lat":6.428055,"lon":-9.429499},"lesotho":{"code":"LS","lat":-29.609988,"lon":28.233608},"lithuania":{"code":"LT","lat":55.169438,"lon":23.881275},"luxembourg":{"code":"LU","lat":49.815273,"lon":6.129583},"latvia":{"code":"LV","lat":56.879635,"lon":24.603189},"libya":{"code":"LY","lat":26.3351,"lon":17.228331},"morocco":{"code":"MA","lat":31.791702,"lon":-7.09262},"monaco":{"code":"MC","lat":43.750298,"lon":7.412841},"moldova":{"code":"MD","lat":47.411631,"lon":28.369885},"montenegro":{"code":"ME","lat":42.708678,"lon":19.37439},"madagascar":{"code":"MG","lat":-18.766947,"lon":46.869107},"marshall islands":{"code":"MH","lat":7.131474,"lon":171.184478},"macedonia [fyrom]":{"code":"MK","lat":41.608635,"lon":21.745275},"mali":{"code":"ML","lat":17.570692,"lon":-3.996166},"myanmar [burma]":{"code":"MM","lat":21.913965,"lon":95.956223},"mongolia":{"code":"MN","lat":46.862496,"lon":103.846656},"macau":{"code":"MO","lat":22.198745,"lon":113.543873},"northern mariana islands":{"code":"MP","lat":17.33083,"lon":145.38469},"martinique":{"code":"MQ","lat":14.641528,"lon":-61.024174},"mauritania":{"code":"MR","lat":21.00789,"lon":-10.940835},"montserrat":{"code":"MS","lat":16.742498,"lon":-62.187366},"malta":{"code":"MT","lat":35.937496,"lon":14.375416},"mauritius":{"code":"MU","lat":-20.348404,"lon":57.552152},"maldives":{"code":"MV","lat":3.202778,"lon":73.22068},"malawi":{"code":"MW","lat":-13.254308,"lon":34.301525},"mexico":{"code":"MX","lat":23.634501,"lon":-102.552784},"malaysia":{"code":"MY","lat":4.210484,"lon":101.975766},"mozambique":{"code":"MZ","lat":-18.665695,"lon":35.529562},"namibia":{"code":"NA","lat":-22.95764,"lon":18.49041},"new caledonia":{"code":"NC","lat":-20.904305,"lon":165.618042},"niger":{"code":"NE","lat":17.607789,"lon":8.081666},"norfolk island":{"code":"NF","lat":-29.040835,"lon":167.954712},"nigeria":{"code":"NG","lat":9.081999,"lon":8.675277},"nicaragua":{"code":"NI","lat":12.865416,"lon":-85.207229},"netherlands":{"code":"NL","lat":52.132633,"lon":5.291266},"norway":{"code":"NO","lat":60.472024,"lon":8.468946},"nepal":{"code":"NP","lat":28.394857,"lon":84.124008},"nauru":{"code":"NR","lat":-0.522778,"lon":166.931503},"niue":{"code":"NU","lat":-19.054445,"lon":-169.867233},"new zealand":{"code":"NZ","lat":-40.900557,"lon":174.885971},"oman":{"code":"OM","lat":21.512583,"lon":55.923255},"panama":{"code":"PA","lat":8.537981,"lon":-80.782127},"peru":{"code":"PE","lat":-9.189967,"lon":-75.015152},"french polynesia":{"code":"PF","lat":-17.679742,"lon":-149.406843},"papua new guinea":{"code":"PG","lat":-6.314993,"lon":143.95555},"philippines":{"code":"PH","lat":12.879721,"lon":121.774017},"pakistan":{"code":"PK","lat":30.375321,"lon":69.345116},"poland":{"code":"PL","lat":51.919438,"lon":19.145136},"saint pierre and miquelon":{"code":"PM","lat":46.941936,"lon":-56.27111},"pitcairn islands":{"code":"PN","lat":-24.703615,"lon":-127.439308},"puerto rico":{"code":"PR","lat":18.220833,"lon":-66.590149},"palestinian territories":{"code":"PS","lat":31.952162,"lon":35.233154},"portugal":{"code":"PT","lat":39.399872,"lon":-8.224454},"palau":{"code":"PW","lat":7.51498,"lon":134.58252},"paraguay":{"code":"PY","lat":-23.442503,"lon":-58.443832},"qatar":{"code":"QA","lat":25.354826,"lon":51.183884},"r\u00e9union":{"code":"RE","lat":-21.115141,"lon":55.536384},"romania":{"code":"RO","lat":45.943161,"lon":24.96676},"serbia":{"code":"RS","lat":44.016521,"lon":21.005859},"russia":{"code":"RU","lat":61.52401,"lon":105.318756},"rwanda":{"code":"RW","lat":-1.940278,"lon":29.873888},"saudi arabia":{"code":"SA","lat":23.885942,"lon":45.079162},"solomon islands":{"code":"SB","lat":-9.64571,"lon":160.156194},"seychelles":{"code":"SC","lat":-4.679574,"lon":55.491977},"sudan":{"code":"SD","lat":12.862807,"lon":30.217636},"sweden":{"code":"SE","lat":60.128161,"lon":18.643501},"singapore":{"code":"SG","lat":1.352083,"lon":103.819836},"saint helena":{"code":"SH","lat":-24.143474,"lon":-10.030696},"slovenia":{"code":"SI","lat":46.151241,"lon":14.995463},"svalbard and jan mayen":{"code":"SJ","lat":77.553604,"lon":23.670272},"slovakia":{"code":"SK","lat":48.669026,"lon":19.699024},"sierra leone":{"code":"SL","lat":8.460555,"lon":-11.779889},"san marino":{"code":"SM","lat":43.94236,"lon":12.457777},"senegal":{"code":"SN","lat":14.497401,"lon":-14.452362},"somalia":{"code":"SO","lat":5.152149,"lon":46.199616},"suriname":{"code":"SR","lat":3.919305,"lon":-56.027783},"s\u00e3o tom\u00e9 and pr\u00edncipe":{"code":"ST","lat":0.18636,"lon":6.613081},"el salvador":{"code":"SV","lat":13.794185,"lon":-88.89653},"syria":{"code":"SY","lat":34.802075,"lon":38.996815},"swaziland":{"code":"SZ","lat":-26.522503,"lon":31.465866},"turks and caicos islands":{"code":"TC","lat":21.694025,"lon":-71.797928},"chad":{"code":"TD","lat":15.454166,"lon":18.732207},"french southern territories":{"code":"TF","lat":-49.280366,"lon":69.348557},"togo":{"code":"TG","lat":8.619543,"lon":0.824782},"thailand":{"code":"TH","lat":15.870032,"lon":100.992541},"tajikistan":{"code":"TJ","lat":38.861034,"lon":71.276093},"tokelau":{"code":"TK","lat":-8.967363,"lon":-171.855881},"timor-leste":{"code":"TL","lat":-8.874217,"lon":125.727539},"turkmenistan":{"code":"TM","lat":38.969719,"lon":59.556278},"tunisia":{"code":"TN","lat":33.886917,"lon":9.537499},"tonga":{"code":"TO","lat":-21.178986,"lon":-175.198242},"turkey":{"code":"TR","lat":38.963745,"lon":35.243322},"trinidad and tobago":{"code":"TT","lat":10.691803,"lon":-61.222503},"tuvalu":{"code":"TV","lat":-7.109535,"lon":177.64933},"taiwan":{"code":"TW","lat":23.69781,"lon":120.960515},"tanzania":{"code":"TZ","lat":-6.369028,"lon":34.888822},"ukraine":{"code":"UA","lat":48.379433,"lon":31.16558},"uganda":{"code":"UG","lat":1.373333,"lon":32.290275},"united states":{"code":"US","lat":37.09024,"lon":-95.712891},"uruguay":{"code":"UY","lat":-32.522779,"lon":-55.765835},"uzbekistan":{"code":"UZ","lat":41.377491,"lon":64.585262},"vatican city":{"code":"VA","lat":41.902916,"lon":12.453389},"saint vincent and the grenadines":{"code":"VC","lat":12.984305,"lon":-61.287228},"venezuela":{"code":"VE","lat":6.42375,"lon":-66.58973},"british virgin islands":{"code":"VG","lat":18.420695,"lon":-64.639968},"u.s. virgin islands":{"code":"VI","lat":18.335765,"lon":-64.896335},"vietnam":{"code":"VN","lat":14.058324,"lon":108.277199},"vanuatu":{"code":"VU","lat":-15.376706,"lon":166.959158},"wallis and futuna":{"code":"WF","lat":-13.768752,"lon":-177.156097},"samoa":{"code":"WS","lat":-13.759029,"lon":-172.104629},"kosovo":{"code":"XK","lat":42.602636,"lon":20.902977},"yemen":{"code":"YE","lat":15.552727,"lon":48.516388},"mayotte":{"code":"YT","lat":-12.8275,"lon":45.166244},"south africa":{"code":"ZA","lat":-30.559482,"lon":22.937506},"zambia":{"code":"ZM","lat":-13.133897,"lon":27.849332},"zimbabwe":{"code":"ZW","lat":-19.015438,"lon":29.154857},"usa":{"code":"US","lat":37.09024,"lon":-95.712891},"united states of america":{"code":"US","lat":37.09024,"lon":-95.712891},"uk":{"code":"GB","lat":55.378051,"lon":-3.435973},"great britain":{"code":"GB","lat":55.378051,"lon":-3.435973}};

  (function renderWorldMap(){
    const mapLegend = document.getElementById('mapLegend');
    const wmPinsLayer = document.getElementById('wmPinsLayer');
    if(!mapLegend || !wmPinsLayer) return;

    function slugify(name){
      return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    }
    function lonlatToXY(lon, lat, w, h){
      return { x: (lon + 180) / 360 * w, y: (90 - lat) / 180 * h };
    }
    // cycle through a few label offsets so pins sitting close together don't
    // automatically stack their text right on top of each other
    const LABEL_OFFSETS = [
      { dx: 0,  dy: -11, anchor: 'middle' }, // above
      { dx: 0,  dy: 17,  anchor: 'middle' }, // below
      { dx: 9,  dy: 4,   anchor: 'start'  }, // right
      { dx: -9, dy: 4,   anchor: 'end'    }  // left
    ];

    let legendHTML = '';
    let pinsHTML = '';
    let missing = [];

    EXCHANGE_COUNTRIES.forEach((name, i) => {
      const slug = slugify(name);
      const info = COUNTRY_COORDS[name.toLowerCase().trim()];
      legendHTML += `<span class="country-chip" data-country="${slug}">${name}</span>`;

      if(!info){
        missing.push(name);
        return; // no coordinates found — chip still shows, pin is skipped
      }
      const { x, y } = lonlatToXY(info.lon, info.lat, 1000, 500);
      const off = LABEL_OFFSETS[i % LABEL_OFFSETS.length];
      pinsHTML += `<g class="wm-pin" data-country="${slug}" transform="translate(${x.toFixed(1)},${y.toFixed(1)})">` +
                  `<circle class="wm-pin-ring" r="0"/>` +
                  `<circle class="wm-pin-dot" r="4.5"/>` +
                  `<text class="wm-pin-label" x="${off.dx}" y="${off.dy}" text-anchor="${off.anchor}">${info.code}</text>` +
                  `</g>`;
    });

    mapLegend.innerHTML = legendHTML;
    wmPinsLayer.innerHTML = pinsHTML;

    if(missing.length){
      console.warn('AIESEC in LUCT map: no coordinates found for: ' + missing.join(', ') +
        ' — check the spelling in EXCHANGE_COUNTRIES matches a name COUNTRY_COORDS recognizes.');
    }

    // hovering/clicking a country in the list highlights its pin, and vice versa
    const chips = mapLegend.querySelectorAll('.country-chip');
    const pins = wmPinsLayer.querySelectorAll('.wm-pin');
    function setActive(country){
      chips.forEach(c => c.classList.toggle('active', c.dataset.country === country));
      pins.forEach(p => p.classList.toggle('active', p.dataset.country === country));
    }
    function clearActive(){
      chips.forEach(c => c.classList.remove('active'));
      pins.forEach(p => p.classList.remove('active'));
    }
    chips.forEach(chip => {
      chip.addEventListener('mouseenter', () => setActive(chip.dataset.country));
      chip.addEventListener('mouseleave', clearActive);
      chip.addEventListener('click', () => setActive(chip.dataset.country));
    });
    pins.forEach(pin => {
      pin.addEventListener('mouseenter', () => setActive(pin.dataset.country));
      pin.addEventListener('mouseleave', clearActive);
      pin.addEventListener('click', () => setActive(pin.dataset.country));
    });
  })();

  // ---- video boxes (Featured Story, Impact Project, etc.): mute/unmute toggle ----
  // handles every ".video-ph" box on the page, not just one, so this keeps
  // working automatically if more autoplay video boxes are added later
  document.querySelectorAll('.video-ph').forEach(videoBox => {
    const video = videoBox.querySelector('.ph-video');
    const muteBtn = videoBox.querySelector('.mute-toggle');
    if(!video || !muteBtn) return;
    muteBtn.addEventListener('click', () => {
      video.muted = !video.muted;
      muteBtn.textContent = video.muted ? '🔇' : '🔊';
      muteBtn.setAttribute('aria-label', video.muted ? 'Unmute video' : 'Mute video');
    });
  });
