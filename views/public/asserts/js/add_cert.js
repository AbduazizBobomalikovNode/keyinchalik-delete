// document.addEventListener("click", (e) => {
//     if (e.target.matches("button[type='submit']")) {
//         let eml = e.target.parentElement.querySelector("input[name='file']");
//         if (eml) {
//             e.target.parentElement.removeChild(eml);
//             alert("olindi!");
//         } else {
//             alert("Element topilmadi!");
//         }
//     }
// });



let select_doc = document.getElementById("doc_select");
let select_lang = document.getElementById("lang_select");
let forms_hide = document.getElementsByClassName("forms-sample")
let langs = document.getElementsByClassName("lang_in");
let select_doc_fun = () => {
    for (let index = 0; index < forms_hide.length; index++) {
        const element = forms_hide[index];
        // console.log(element.id, " == ", `f${select_doc.value}${select_lang.value}`, element.id == `f${select_doc.value}${select_lang.value}`)
        if (element.id == `f${select_doc.value}${select_lang.value}`) {
            element.style.display = "block";
            document.getElementById("doc_name").innerText = select_doc.selectedOptions[0].innerText;
            continue;
        }
        element.style.display = "none";
    }
}
select_lang.onchange = select_doc_fun;
select_doc.onchange = select_doc_fun;
setInterval(() => {
    select_doc_fun();
}, 100);

// Ruxsat etilgan kengaytmalar ro'yxati
const allowedExtensions = ['doc', 'docx', 'xls', 'xlsx'];

document.querySelectorAll('#fileInput').forEach((elm) => {
    const doc_number = Number(elm.getAttribute('doc')); // Bir marta aniqlash
    const fileInputButton = document.querySelector(`[metka='fileInput${doc_number}']`);
    console.log(fileInputButton, doc_number);
    if (fileInputButton) {
        fileInputButton.addEventListener('click', async function () {
            console.log(this);
            let inputFile = document.querySelectorAll('#fileInput')[doc_number - 1];
            const file = inputFile.files[0];
            if (file) {
                let result = await postFile(file);
                if (result) {
                    let inps = document.querySelectorAll("[name=\"original_document_path\"]");
                    if (inps.length > 0) {
                        inps[doc_number - 1].value = result.file.filename;
                    }
                    console.log("fayl  manzili :" + result.file.filename,inps,doc_number - 1)
                    const fileName = file.name;
                    const fileExtension = fileName.split('.').pop().toLowerCase(); // Fayl kengaytmasini aniqlash

                    if (allowedExtensions.includes(fileExtension)) {
                        elm.style.color = "green"; // Yashil rang
                        document.querySelector(`[mark='${doc_number}']`).hidden = false; // Belgini ko'rsatish
                        document.querySelectorAll("[type='submit']")[doc_number - 1].removeAttribute('disabled');
                    } else {
                        alert("Faqat .doc, .docx, .xls, va .xlsx fayllarini tanlash mumkin.");
                        elm.style.color = "rgba(255, 40, 40, 0.756)"; // Qizil rang
                        document.querySelector(`[mark='${doc_number}']`).hidden = true; // Belgini yashirish
                        this.value = ''; // Faylni bekor qilish
                        document.querySelectorAll("[type='submit']").forEach((elm) => {
                            elm.setAttribute('disabled', 'true');
                        })
                    }
                } else {
                    alert("Siz kritgan  hujjat yaroqsiz dep topildi! \nProtokolni kiritmasdan hujjatni to'ldira olmaysiz!");
                    elm.style.color = "rgba(255, 40, 40, 0.756)"; // Qizil rang
                    document.querySelector(`[mark='${doc_number}']`).hidden = true; // Belgini yashirish
                    this.value = ''; // Faylni bekor qilish
                    document.querySelectorAll("[type='submit']").forEach((elm) => {
                        elm.setAttribute('disabled', 'true');
                    })
                }
            } else {
                alert("Protokolni kiritmasdan hujjatni to'ldira olmaysiz!");
                elm.style.color = "rgba(255, 40, 40, 0.756)"; // Qizil rang
                document.querySelector(`[mark='${doc_number}']`).hidden = true; // Belgini yashirish
                this.value = ''; // Faylni bekor qilish
                document.querySelectorAll("[type='submit']").forEach((elm) => {
                    elm.setAttribute('disabled', 'true');
                })
            }
        });
    }

    elm.addEventListener('click', function () {
        elm.style.color = "rgba(255, 40, 40, 0.756)"; // Qizil rang
        document.querySelector(`[mark='${doc_number}']`).hidden = true; // Belgini yashirish
        this.value = ''; // Faylni bekor qilish
        document.querySelectorAll("[type='submit']").forEach((elm) => {
            elm.setAttribute('disabled', 'true');
        })
    });
});


// Fayl tanlangandan so'ng kengaytmani tekshirish


const postFile = async (file) => {
    let url = "/certifcate/api/check-document";
    // Faylni yuborish uchun FormData obyekti
    const formData = new FormData();
    formData.append('document', file); // 'file' - serverda foydalaniladigan nom

    try {
        // Fetch orqali POST so'rov yuborish
        const response = await fetch(new URL(url, window.location.origin), {
            method: 'POST',
            body: formData, // FormData ni body sifatida yuborish
            credentials: 'include', // Cookie'larni yuborish uchun
        });

        // Javobni qayta ishlash
        if (response.ok) {
            const result = await response.json(); // JSON formatida javob olish
            console.log('Natija:', result);
            return result; // Javobni qaytarish
        } else {
            console.error('Xato:', response.statusText);
            return false; // Xato bo'lsa null qaytarish
        }
    } catch (error) {
        console.error('So\'rovda xatolik yuz berdi:', error);
        return false; // Xatolik yuz berganda null qaytarish
    }
};
