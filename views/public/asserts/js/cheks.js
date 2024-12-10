var interval = null; // Global interval o'zgaruvchisi
var responseStatus = false;
let processBar = document.getElementById("prossees");
let progressbar = document.getElementById("progressbar");
var elementCount = 0;
let oldQuary = null;
let oldQuaryUrl = null;
// document.getElementById("getSearchResult")
window.onload = () => {
    let buttons = document.querySelectorAll('#getSearchResult, #NextButton, #PreviousButton, .ChooseButton');


    const dialog = document.querySelector("dialog");
    {
        let isMouseDown = false;
        let startY;
        let scrollTop;


        // Mouse bosilganda boshlang'ich joyni va skroll pozitsiyasini olish
        document.addEventListener('mousedown', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') {
                return;
            }
            e.target.ondblclick = () => {
                if (e.target.innerText && e.target.tagName != "BODY") {
                    // Matnni clipboard (bufer) ga nusxalash
                    navigator.clipboard.writeText(e.target.innerText)
                        .then(() => {
                            document.getElementById("dialog").innerHTML =
                                "Matn buferga nusxalandi: <b style='color:#f96868'>" + e.target.innerText + "</b>";
                            dialog.showModal();
                            console.log("Matn buferga nusxalandi:", e.target.innerText);
                            setTimeout(() => dialog.close(), 700)
                        })
                        .catch(err => {
                            console.error("Matnni buferga nusxalashda xato:", err);
                        });
                }
            };

            isMouseDown = true;
            startY = e.pageY; // Mouse bosilgan joy
            scrollTop = document.documentElement.scrollTop || window.scrollY; // Joriy sahifa skroll pozitsiyasi
            e.preventDefault(); // Standart text selection va boshqa default harakatlarning oldini oladi
        });

        // Mouse harakatlanayotgan vaqtda skrollni moslashtirish
        document.addEventListener('mousemove', (e) => {
            if (!isMouseDown) return; // Agar mouse bosilmagan bo'lsa, funksiyani bajarishni to'xtatish
            const y = e.pageY; // Mouse harakatlangan joy
            const walk = (y - startY); // Bosilgan joy va harakat orasidagi masofa
            document.documentElement.scrollTop = scrollTop - walk; // Vertikal sahifa skrollini o'zgartirish
            // Yoki window.scrollTo(0, scrollTop - walk); ham ishlatilishi mumkin
        });

        // Mouse qo'yib yuborilganda skroll holatini saqlash
        document.addEventListener('mouseup', () => {
            isMouseDown = false;
        });

        document.addEventListener('mouseleave', () => {
            isMouseDown = false; // Sichqoncha hujjatdan tashqariga chiqqanda tugmani qo'yib yuborilgan deb hisoblanadi
        });
    }
    if (window.location.pathname == '/certifcate') {
        const scrollableDiv = document.getElementsByClassName("table-responsive")[0];

        let isMouseDown = false;
        let startX;
        let scrollLeft;
        // Mouse bosilganda boshlang'ich joyni va skroll pozitsiyasini olish
        scrollableDiv.addEventListener('mousedown', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') {
                return;
            }
            e.target.ondblclick = () => {
                if (e.target.innerText) {
                    // Matnni clipboard (bufer) ga nusxalash
                    navigator.clipboard.writeText(e.target.innerText)
                        .then(() => {
                            console.log("Matn buferga nusxalandi:", e.target.innerText);
                        })
                        .catch(err => {
                            console.error("Matnni buferga nusxalashda xato:", err);
                        });
                }
            };
            isMouseDown = true;
            startX = e.pageX - scrollableDiv.offsetLeft;
            scrollLeft = scrollableDiv.scrollLeft;
        });

        // Mouse harakatlanayotgan vaqtda skrollni moslashtirish
        scrollableDiv.addEventListener('mousemove', (e) => {
            if (!isMouseDown) return; // Agar mouse bosilmagan bo'lsa, funksiyani bajarishni to'xtatish
            const x = e.pageX - scrollableDiv.offsetLeft;
            const walk = (x - startX); // Bosilgan joy va harakat orasidagi masofa
            scrollableDiv.scrollLeft = scrollLeft - walk;
        });

        // Mouse qo'yib yuborilganda skroll holatini saqlash
        scrollableDiv.addEventListener('mouseup', () => {
            isMouseDown = false;
        });

        scrollableDiv.addEventListener('mouseleave', () => {
            isMouseDown = false; // Divdan tashqariga chiqqanda ham tugmani qo'yib yuborilgan deb hisoblanadi
        });
    }
    {
        // POST so'rovini yuborish

        const postData = async (obj, url, method = '') => {
            oldQuary = obj;
            oldQuaryUrl = url;
            responseStatus = false;
            const response = await fetch(window.location.href + url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    // Cookie avtomatik olinadi
                },
                body: JSON.stringify(obj), // Body ni JSON formatida yuborish
                credentials: 'include', // Cookie'larni yuborish uchun
            });

            if (response.ok) {
                if (method == 'get') {
                    const result = await response.text();
                    // console.log('Natija:', result);
                    responseStatus = true;
                    return result;
                }
                const result = await response.json(); // Javobni JSON formatida olish
                console.log('Natija:', result);
                responseStatus = true;
                return result.count;
            } else {
                console.error('Xato:', response.statusText);
                return 0;
            }
        };

        console.log(buttons);


        let button = document.getElementById("delete");
        let table = document.getElementsByTagName("table")[0];

        let filter = document.getElementById("filter");
        let filter1 = document.getElementById("filter1");
        let filter2 = document.getElementById("filter2");
        let filter3 = document.getElementById("filter3");
        let filter3_chek = document.getElementById("filter3_chek");
        let filter4 = document.getElementById("filter4");
        let filterstatus = document.getElementById("filterstatus");

        let searchdata = document.getElementById("searchdata");
        let searchCount = document.getElementById("searchCount");
        // let searchButton = document.getElementById("getSearchResult");

        searchCount.innerText = "0 ta";

        console.log(filter, filter1, filter2, filter3, filter4, filter3.value);

        let filter1vs4 = async (method = '', page) => {

            let filter3_demo = filter3.value;
            if (filter3.value == "") filter3_demo == "Hammasi";


            if (!filter3_chek.checked) {
                filter3_demo = "Hammasi";
            }
            let word = searchdata.value
            let obj = {
                doc: filter1.value,
                lang: filter2.value,
                date: filter3_demo,
                employee: parseInt(filter4.value) || 0,
                search: word,
                status: parseInt(filterstatus.value)
            };
            if (method == 'get') {
                page = page || 1;
                const url = `/api/results/${page}`;
                console.log(url, JSON.stringify(obj), JSON.stringify(oldQuary), JSON.stringify(obj) != JSON.stringify(oldQuary));
                console.log(oldQuaryUrl != url, oldQuaryUrl, url);
                if (JSON.stringify(obj) != JSON.stringify(oldQuary) || oldQuaryUrl != url) {

                    processingFun(elementCount || 50);
                    let result = await postData(obj, url, method);
                    return result;
                }
                return;

            }
            const url = '/api/search';
            if (JSON.stringify(obj) != JSON.stringify(oldQuary) || oldQuaryUrl != url) {
                processingFun(50);
                let count = await postData(obj, url);

                searchCount.innerText = count + " ta";;
                elementCount = count;
            }

            // window.location.href = `/certifcate/page/1?doc=${filter1.value}&lang=${filter2.value}&date=${filter3_demo}&employee=${filter4.value}`;

        }

        if (filter1 && filter2 && filter3 && filter4) {
            filter1.onchange = filter1vs4;
            filter2.onchange = filter1vs4;
            searchdata.onchange = filter1vs4;
            filterstatus.onchange = filter1vs4;
            filter3_chek.onchange = () => {
                if (filter3_chek.checked && filter3.value.length > 1) filter1vs4();
            };
            if (filter3_chek.checked) {
                filter3.onchange = filter1vs4;
            }
            filter4.onchange = filter1vs4;
        }

        if (filter) {
            filter.addEventListener('onchange', () => {
                setTimeout(() => {
                    if (filter.value == "Hammasi") {
                        window.location.href = '/user'
                    } else {
                        window.location.href = '/user/page/1$' + filter.value;
                    }
                }, 1000)
            });
        }
        console.log(button)
        if (button) {
            button.onmousedown = () => {
                const el = document.getElementsByClassName("form-check-input");
                let c = 0;
                button.href = button.title;
                for (let index = 0; index < el.length; index++) {
                    const element = el[index];
                    if (element.checked && element.id != "all") {
                        c++;
                        button.href = button.href + '+' + element.id;
                    }
                }
                if (c == 0) {
                    button.href = "#"
                }
            }
            // button.addEventListener('onmousedown', () => {
            //     const el = document.getElementsByClassName("form-check-input");
            //     let c = 0;
            //     button.href = button.title;
            //     for (let index = 0; index < el.length; index++) {
            //         const element = el[index];
            //         if (element.checked && element.id != "all") {
            //             c++;
            //             button.href = button.href + '+' + element.id;
            //         }
            //     }
            //     if (c == 0) {
            //         button.href = "#"
            //     }
            // });
        }

        // Tugmachalarni tanlash



        function reset() {
            const scrollableDiv = document.getElementsByClassName("table-responsive")[0];

            let isMouseDown = false;
            let startX;
            let scrollLeft;
            // Mouse bosilganda boshlang'ich joyni va skroll pozitsiyasini olish
            scrollableDiv.addEventListener('mousedown', (e) => {
                if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') {
                    return;
                }
                e.target.ondblclick = () => {
                    if (e.target.innerText) {
                        // Matnni clipboard (bufer) ga nusxalash
                        navigator.clipboard.writeText(e.target.innerText)
                            .then(() => {
                                console.log("Matn buferga nusxalandi:", e.target.innerText);
                            })
                            .catch(err => {
                                console.error("Matnni buferga nusxalashda xato:", err);
                            });
                    }
                };
                isMouseDown = true;
                startX = e.pageX - scrollableDiv.offsetLeft;
                scrollLeft = scrollableDiv.scrollLeft;
            });

            // Mouse harakatlanayotgan vaqtda skrollni moslashtirish
            scrollableDiv.addEventListener('mousemove', (e) => {
                if (!isMouseDown) return; // Agar mouse bosilmagan bo'lsa, funksiyani bajarishni to'xtatish
                const x = e.pageX - scrollableDiv.offsetLeft;
                const walk = (x - startX); // Bosilgan joy va harakat orasidagi masofa
                scrollableDiv.scrollLeft = scrollLeft - walk;
            });

            // Mouse qo'yib yuborilganda skroll holatini saqlash
            scrollableDiv.addEventListener('mouseup', () => {
                isMouseDown = false;
            });

            scrollableDiv.addEventListener('mouseleave', () => {
                isMouseDown = false; // Divdan tashqariga chiqqanda ham tugmani qo'yib yuborilgan deb hisoblanadi
            });


            buttons = document.querySelectorAll('#getSearchResult, #NextButton, #PreviousButton, .ChooseButton');
            buttons.forEach(button => {
                button.onclick = async () => {

                    let pageAttr = button.getAttribute('data');
                    let page;
                    if (pageAttr) {
                        page = parseInt(pageAttr.split('=')[1]); // currentPage= qiymatining raqamini olish
                    } // data atributining qiymatini olamiz
                    console.log("page", page);
                    let allPage = Math.ceil(elementCount / 15);
                    document.getElementById("pageMark").innerHTML = (page || 1) + "<b style='font-size:  20px;'>/" + allPage + "</b>";
                    let result = await filter1vs4('get', page);
                    if (result) {
                        table.innerHTML = result;
                        console.log(elementCount);
                        document.getElementById("filter_count").innerText = elementCount + "";
                        reset();
                    }
                };
            });
        }
        reset();


    }


}



function processingFun(count) {
    document.getElementById('fokus_').scrollIntoView({ behavior: 'smooth' });
    progressbar.style.display = "block";
    document.getElementById("prosesStatus").innerText = " foiz  jarayon yakunlandi";

    // Oldingi intervalni to'xtatamiz
    if (interval) {
        clearInterval(interval);
    }

    // Har bir qadam uchun sarflanadigan vaqt (ms)
    count = count || 1;
    const spentTime = 3;
    const timeTotal = count * spentTime + 2000; // Umumiy vaqt (ms)

    let counter = 0; // Progress barni kuzatish
    const intervalDuration = timeTotal / 100; // Progress barni yangilash vaqti

    // Progress barni to'ldirish uchun interval
    interval = setInterval(() => {
        // Progress barni yangilash
        processBar.style.width = counter + "%";

        // Progress 100% ga yetganda intervalni to'xtatish
        if (counter >= 100) {
            if (!responseStatus) {
                return;
            }
            clearInterval(interval); // Intervalni to'xtatish
            console.log("Jarayon tugadi!"); // Tugash haqida xabar
            // Qo'shimcha xabar yoki harakatlar uchun joy
            setTimeout(() => {
                progressbar.style.display = "none";
                processBar.style.width = "0%";
                document.getElementById("prosesStatus").innerText = "natija  topildi";
                searchCount.innerText = elementCount + " ta";
            }, 1000);
        } else {
            counter++; // Progressni oshirish
        }

        searchCount.innerText = counter + "%";
    }, intervalDuration);
}


function chekbox() {
    const el = document.getElementsByClassName("form-check-input");
    document.getElementById("all").checked = false;
    for (let index = 0; index < el.length; index++) {
        const element = el[index];
        if (element.checked) {
            document.getElementById("all").checked = true;
        }
    }
    let btn = document.getElementById("btn-delete");
    let class_name = btn.className;
    if (document.getElementById("all").checked) {
        btn.className = class_name.replaceAll("disabled", "");
    } else {
        btn.className = class_name.replaceAll("disabled", "");
        btn.className += " disabled";
    }
}

function chekboxAll() {
    const el = document.getElementsByClassName("form-check-input");
    let flag = document.getElementById("all").checked;
    let btn = document.getElementById("btn-delete");
    let class_name = btn.className;
    if (flag) {
        btn.className = class_name.replaceAll("disabled", "");
    } else {
        btn.className = class_name.replaceAll("disabled", "");
        btn.className += " disabled";
    }
    for (let index = 0; index < el.length; index++) {
        const element = el[index];
        element.checked = flag;
    }
}