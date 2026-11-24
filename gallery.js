const photoButtons=[...document.querySelectorAll('.gallery-open')];
const lightbox=document.querySelector('#lightbox');
const lightboxImage=document.querySelector('#lightbox-image');
const lightboxCaption=document.querySelector('#lightbox-caption');
let current=0, lastFocus=null;
function captionFor(button){const fig=button.closest('figure');return `${fig.querySelector('b').textContent} — ${fig.querySelector('figcaption span').textContent}`}
function showPhoto(index){current=(index+photoButtons.length)%photoButtons.length;const button=photoButtons[current];lightboxImage.src=button.querySelector('img').src;lightboxImage.alt=button.querySelector('img').alt;lightboxCaption.textContent=captionFor(button)}
function openPhoto(index){lastFocus=document.activeElement;showPhoto(index);lightbox.hidden=false;document.body.style.overflow='hidden';lightbox.querySelector('.lightbox-close').focus()}
function closePhoto(){lightbox.hidden=true;document.body.style.overflow='';lastFocus?.focus()}
photoButtons.forEach((button,index)=>button.addEventListener('click',()=>openPhoto(index)));
lightbox.querySelector('.lightbox-close').addEventListener('click',closePhoto);
lightbox.querySelector('.lightbox-prev').addEventListener('click',()=>showPhoto(current-1));
lightbox.querySelector('.lightbox-next').addEventListener('click',()=>showPhoto(current+1));
lightbox.addEventListener('click',event=>{if(event.target===lightbox)closePhoto()});
document.addEventListener('keydown',event=>{if(lightbox.hidden)return;if(event.key==='Escape')closePhoto();if(event.key==='ArrowLeft')showPhoto(current-1);if(event.key==='ArrowRight')showPhoto(current+1)});

