/* VEROIR script.js - SAFE UPGRADED VERSION
   FIXES:
   - Cart item not adding issue
   - Exact product image now always shows in cart
   NO layout / HTML / CSS changes
*/

/* ---------- Storage helpers ---------- */
function loadCart(){ try{ return JSON.parse(localStorage.getItem('veroirCart')||'[]'); }catch(e){return [];} }
function saveCart(c){ localStorage.setItem('veroirCart', JSON.stringify(c)); updateCartCount(); }
function clearCart(){ localStorage.removeItem('veroirCart'); updateCartCount(); }

function loadUsers(){ try{ return JSON.parse(localStorage.getItem('veroir_users')||'[]'); }catch(e){return [];} }
function saveUsers(u){ localStorage.setItem('veroir_users', JSON.stringify(u)); }

function setCurrentUser(email){ localStorage.setItem('veroir_current_user', email); }
function getCurrentUser(){ return localStorage.getItem('veroir_current_user') || null; }
function logoutCurrentUser(){ localStorage.removeItem('veroir_current_user'); updateAuthUI(); }

function saveOrder(order){
    try{
        var arr = JSON.parse(localStorage.getItem('veroir_orders')||'[]');
        arr.push(order);
        localStorage.setItem('veroir_orders', JSON.stringify(arr));
        localStorage.setItem('veroir_last_order', order.id);
    }catch(e){console.error(e);}
}

/* ---------- Cart helpers ---------- */
function addToCartObj(obj){
    var cart = loadCart();
    var found = cart.find(function(x){ return x.id === obj.id; });
    if(found){
        found.qty += 1;
    }else{
        cart.push(obj);
    }
    saveCart(cart);
    alert(obj.name + ' added to cart');
}

function addToCart(id,name,price,img){
    addToCartObj({
        id: id,
        name: name,
        price: Number(price)||0,
        img: img || '',
        qty: 1
    });
}

function updateCartCount(){
    var el = document.querySelector('.cart-count');
    if(!el) return;
    var cart = loadCart();
    var total = cart.reduce(function(s,i){ return s + (i.qty||0); },0);
    el.textContent = total;
    el.style.display = total>0 ? 'inline-block' : 'none';
}

/* ---------- Cart render ---------- */
function renderCart(){
    var container = document.querySelector('.cart-items');
    if(!container){
        var h2 = document.querySelector('h2');
        if(h2 && /cart/i.test(h2.textContent)){
            container = document.createElement('div');
            container.className = 'cart-items';
            h2.parentNode.insertBefore(container, h2.nextSibling);
        }else return;
    }

    var cart = loadCart();
    container.innerHTML = '';

    if(cart.length === 0){
        container.innerHTML = '<p>Your cart is empty.</p>';
        var tot = document.querySelector('.cart-total');
        if(tot) tot.textContent = '₹0';
        return;
    }

    cart.forEach(function(item, idx){
        var row = document.createElement('div');
        row.className = 'cart-row';

        row.innerHTML =
            '<div class="cart-left">' +
                '<img src="'+ item.img +'" width="90">' +
            '</div>' +
            '<div class="cart-mid">' +
                '<div class="cart-name">'+ item.name +'</div>' +
                '<div class="cart-price">₹'+ item.price +'</div>' +
            '</div>' +
            '<div class="cart-right">' +
                '<input type="number" min="1" value="'+ item.qty +'" data-index="'+ idx +'" class="qty-input">' +
                '<div class="item-total">₹'+ (item.price * item.qty) +'</div>' +
                '<button class="remove-btn" data-index="'+ idx +'">Remove</button>' +
            '</div>';

        container.appendChild(row);
    });

    document.querySelectorAll('.qty-input').forEach(function(inp){
        inp.addEventListener('change', function(){
            var i = Number(this.dataset.index);
            var cart = loadCart();
            cart[i].qty = Number(this.value)||1;
            saveCart(cart);
            renderCart();
        });
    });

    document.querySelectorAll('.remove-btn').forEach(function(btn){
        btn.addEventListener('click', function(){
            var i = Number(this.dataset.index);
            var cart = loadCart();
            cart.splice(i,1);
            saveCart(cart);
            renderCart();
        });
    });

    var totalEl = document.querySelector('.cart-total');
    if(totalEl){
        var total = cart.reduce(function(s,i){ return s + i.price*i.qty; },0);
        totalEl.textContent = '₹' + total.toFixed(2);
    }
}

/* ---------- Wire buttons (SAFE FIX) ---------- */
function wireButtons(){

    /* dataset-based buttons */
    document.querySelectorAll('.add-to-cart').forEach(function(b){
        if(b.__wired) return;
        b.__wired = true;

        b.addEventListener('click', function(e){
            e.preventDefault();

            var id = this.dataset.id || this.textContent.trim();
            var name = this.dataset.name || this.textContent.trim();
            var price = this.dataset.price || 0;

            /* ✅ SAFE image capture */
            var img = this.dataset.img || '';
            if(!img){
                var box = this.closest('.item');
                if(box){
                    var im = box.querySelector('img');
                    img = im ? im.getAttribute('src') : '';
                }
            }

            addToCart(id, name, price, img);
        });
    });

    /* fallback buttons inside .item (unchanged logic) */
    document.querySelectorAll('.item button').forEach(function(b){
        if(b.__wired) return;
        b.__wired = true;

        b.addEventListener('click', function(e){
            e.preventDefault();

            var itemDiv = this.closest('.item');
            if(!itemDiv) return;

            var nameEl = itemDiv.querySelector('h3, h2, h4');
            var priceEl = itemDiv.querySelector('p');
            var imgEl = itemDiv.querySelector('img');

            var name = nameEl ? nameEl.textContent.trim() : 'Product';
            var price = priceEl ? priceEl.textContent.replace(/[^0-9.]/g,'') : '0';
            var img = imgEl ? imgEl.getAttribute('src') : '';

            var id = (name + '-' + price).replace(/\s+/g,'-').toLowerCase();

            addToCart(id, name, price, img);
        });
    });
}

/* ---------- Auth ---------- */
function wireAuthForms(){
    var signup = document.querySelector('#signup-form');
    if(signup){
        signup.addEventListener('submit', function(e){
            e.preventDefault();
            var email = signup.querySelector('[name="email"]').value.trim();
            var pass = signup.querySelector('[name="password"]').value;
            if(!email || !pass) return alert('Enter email and password');
            var users = loadUsers();
            if(users.find(u=>u.email===email)) return alert('User exists');
            users.push({email,password:pass});
            saveUsers(users);
            setCurrentUser(email);
            window.location.href = 'index.html';
        });
    }

    var login = document.querySelector('#login-form');
    if(login){
        login.addEventListener('submit', function(e){
            e.preventDefault();
            var email = login.querySelector('[name="email"]').value.trim();
            var pass = login.querySelector('[name="password"]').value;
            var u = loadUsers().find(x=>x.email===email && x.password===pass);
            if(!u) return alert('Invalid login');
            setCurrentUser(email);
            window.location.href = 'index.html';
        });
    }

    document.querySelectorAll('.logout-btn').forEach(function(b){
        b.onclick = function(e){
            e.preventDefault();
            logoutCurrentUser();
        };
    });

    updateAuthUI();
}

function updateAuthUI(){
    var user = getCurrentUser();
    document.querySelectorAll('.auth-user').forEach(el=>el.style.display = user?'':'none');
    document.querySelectorAll('.auth-guest').forEach(el=>el.style.display = user?'none':'');
}

/* ---------- Checkout ---------- */
function wireCheckout(){
    var btn = document.querySelector('#checkout-btn');
    if(!btn) return;

    btn.onclick = function(e){
        e.preventDefault();
        var user = getCurrentUser();
        if(!user){
            alert('Login required');
            location.href = 'login.html';
            return;
        }

        var cart = loadCart();
        if(!cart.length) return alert('Cart empty');

        var total = cart.reduce((s,i)=>s+i.price*i.qty,0);
        var id = 'ORD'+Date.now();
        saveOrder({id,user,items:cart,total,date:new Date().toISOString()});
        clearCart();
        location.href = 'order-success.html?id='+id;
    };
}

/* ---------- Order success ---------- */
function renderOrderSuccess(){
    var el = document.querySelector('.order-success');
    if(!el) return;
    var id = new URLSearchParams(location.search).get('id');
    var ord = JSON.parse(localStorage.getItem('veroir_orders')||'[]').find(o=>o.id===id);
    if(!ord) return el.innerHTML='Order not found';
    el.innerHTML =
        '<h2>Order Confirmed</h2>' +
        '<p>ID: '+ord.id+'</p>' +
        '<p>Total: ₹'+ord.total+'</p>';
}

/* ---------- Init ---------- */
document.addEventListener('DOMContentLoaded', function(){
    updateCartCount();
    wireButtons();
    renderCart();
    wireAuthForms();
    wireCheckout();
    renderOrderSuccess();
});
