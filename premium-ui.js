
const observer=new IntersectionObserver((e)=>{e.forEach(x=>{if(x.isIntersecting)x.target.classList.add('visible')})},{threshold:.12});
document.querySelectorAll('.section,.panel,.type-card,.hero-card,.part').forEach(el=>{el.classList.add('reveal');observer.observe(el);});
