// Ruxsat etilgan kengaytmalar ro'yxati
const allowedExtensions = ['doc', 'docx', 'xls', 'xlsx'];

// Faylni tanlaganda kengaytmani tekshirish
document.querySelector('[name="file"]').addEventListener('change', function () {
    const fileInput = this;
    const file = fileInput.files[0]; // Tanlangan faylni olish
    if (file) {
        const fileName = file.name;
        const fileExtension = fileName.split('.').pop().toLowerCase(); // Fayl kengaytmasini aniqlash

        if (!allowedExtensions.includes(fileExtension)) {
            alert("Faqat quyidagi kengaytmadagi fayllarni yuklash mumkin: .doc, .docx, .xls, .xlsx");
            fileInput.value = ''; // Faylni bekor qilish
        } else {
            console.log("Fayl qabul qilindi:", fileName);
        }
    }
});

// Fayl yuklab olish funksiyasi
// Fayl yuklab olish funksiyasi
document.getElementById("download").addEventListener("click", async function () {
    const inp = document.querySelector("[name='original_document_path']");
    if (!inp) {
        console.error("Fayl yo'q yoki noto'g'ri element:", inp);
        return;
    }

    const id = inp.value;
    if (!id) {
        alert("Fayl ID kiritilmagan!");
        return;
    }

    const fileUrl = `/certifcate/download/${id}`;
    console.log("Fayl URL:", fileUrl);

    try {
        // Fetch yordamida faylni yuklab olish
        const response = await fetch(fileUrl, {
            method: 'GET',
            credentials: 'include' // Cookie'larni yuborish kerak bo'lsa
        });

        if (!response.ok) {
            throw new Error(`Fayl yuklab olinmadi! Status: ${response.status}`);
        }

        // Javobni Blob formatida olish
        const blob = await response.blob();

        // Fayl nomini olish uchun "Content-Disposition" headerini tekshirish
        const contentDisposition = response.headers.get("Content-Disposition");
        let fileName = "yuklangan_fayl";
        if (contentDisposition) {
            const match = contentDisposition.match(/filename="(.+)"/);
            if (match) {
                fileName = match[1];
            }
        }

        // Faylni yuklash uchun <a> elementi yaratish
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = downloadUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Blob obyektini tozalash
        window.URL.revokeObjectURL(downloadUrl);
        console.log("Fayl muvaffaqiyatli yuklandi:", fileName);
    } catch (error) {
        console.error("Xatolik yuz berdi:", error);
        alert("Faylni yuklab bo'lmadi!");
    }
});


// Fayl yuborish funksiyasi
const postFile = async (file) => {
    const url = "/certifcate/api/check-document";
    const formData = new FormData();
    formData.append('document', file);

    try {
        const response = await fetch(url, {
            method: 'POST',
            body: formData,
            credentials: 'include',
        });

        if (response.ok) {
            const result = await response.json();
            console.log("Natija:", result);
            return result;
        } else {
            console.error("Xato:", response.statusText);
            return false;
        }
    } catch (error) {
        console.error("So'rovda xatolik:", error);
        return false;
    }
};

// Fayl yuklash tugmachasi uchun hodisa
document.querySelector(`[metka='fileInput']`).addEventListener('click', async function () {
    const inputFile = document.querySelector('[name="file"]');
    const file = inputFile.files[0];

    if (file) {
        document.getElementById("download").click();
        const result = await postFile(file);
        console.log(result);
        if (result) {
            const inps = document.querySelector("[name='original_document_path']");
            if (inps) {
                inps.value = result.file.filename;
            }
            console.log("Fayl manzili:", result.file.filename);
            document.forms[0].submit();
        } else {
            alert("Yuklangan fayl yaroqsiz. Iltimos, qaytadan tekshiring.");
            inputFile.value = ''; // Faylni bekor qilish
        }
    } else {
        alert("Fayl tanlanmagan!");
    }
});
