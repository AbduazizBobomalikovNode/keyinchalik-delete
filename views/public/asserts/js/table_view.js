function create_row(num,Rnum) {
    let input = document.createElement("input");
    input.className = "form-control";
    input.type = "text";
    input.name = `ln${num-1}_n${Rnum}`;
    input.required = "";
    input.placeholder = "Yangi qiymatni kiriting"; 
    input.fdprocessedid = "m2n87q";

    return input;
}

function swapChildren(parent, index1, index2) {
    const children = parent.children; // Barcha farzandlarni olish

    // Elementlarni tekshirish
    if (index1 >= children.length || index2 >= children.length) {
        console.error("Index mavjud emas!");
        return;
    }

    // Farzand elementlarni olish
    const child1 = children[index1];
    const child2 = children[index2];

    // Ota elementga kiritish
    const temp = document.createElement("div"); // Yordamchi element
    parent.replaceChild(temp, child1); // Birinchi elementni yordamchiga ko'chirish
    parent.replaceChild(child1, child2); // Ikkinchi elementni birinchiga almashtirish
    parent.replaceChild(child2, temp); // Yordamchidagi elementni ikkinchiga almashtirish
}


if (window.location.pathname.includes("/certifcate/ilova/")) {
    let button_add_tr = document.getElementById("table-dynamik+");
    let button_delete_tr = document.getElementById("table-dynamik-");
    let table = document.getElementById('table2');
    
    
    // Yangi qator qo'shish
    if (button_add_tr) {
        button_add_tr.addEventListener("click", () => {
            
            let newRow = table.insertRow(); // Jadvalga yangi qator qo‘shish
            let cell1 = newRow.insertCell(0); // 1-ustun
            let cell2 = newRow.insertCell(1); // 2-ustun
            let cell3 = newRow.insertCell(2); // 3-ustun
            let cell4 = newRow.insertCell(2); // 4-ustun
            let cell5 = newRow.insertCell(2); // 5-ustun
            let input = document.createElement("input");
            input.name = `ln${table.rows.length-1}_n${1}`;
            input.type = "number";
            input.value = table.children.length - 1;
            input.style.display = "none";

            cell1.innerText = table.children.length - 1;  // 1-ustunga matn qo‘yish
            cell1.appendChild(input);
            cell2.appendChild(create_row(table.rows.length,2)); // 2-ustunga matn qo‘yish
            cell3.appendChild(create_row(table.rows.length,3)); // 3-ustunga matn qo‘yish
            cell4.appendChild(create_row(table.rows.length,4)); // 4-ustunga matn qo‘yish
            cell5.appendChild(create_row(table.rows.length,5)); // 5-ustunga matn qo‘yish

            swapChildren(table,table.children.length - 1,table.children.length - 2);
        });
    }

    // Oxirgi qatorni o'chirish
    if (button_delete_tr) {
        button_delete_tr.addEventListener("click", () => {
            if (table.rows.length > 1) { // Jadvalda kamida bitta qator bo‘lishi kerak
                table.deleteRow(table.rows.length-2); // Oxirgi qatorni o‘chirish
            } else {
                alert("Jadvalda qator qolmadi!"); // Jadval bo'sh bo‘lsa xabar chiqarish
            }
        });
    }

} else {
    let tr1_count = 1;
    let tr2_count = 1;
    let array = document.getElementsByTagName("tr");
    for (let index = 0; index < array.length; index++) {
        const element = array[index];
        if (element.style.display == "table-row") {
            tr_count++;
            console.log(tr_count);
        }
    }

    let button_add_tr = document.getElementById("table-dynamik+");
    let button_delete_tr = document.getElementById("table-dynamik-");
    let button1_add_tr = document.getElementById("table-dynamik1+");
    let button1_delete_tr = document.getElementById("table-dynamik1-");

    let list1_tr = document.getElementById('table2').children;
    let list2_tr = null;
    if (button1_add_tr && button1_delete_tr) {
        list2_tr = document.getElementById('table3').children;
    }


    button_delete_tr.onclick = () => {
        if (tr1_count > 1) {
            tr1_count--;
            list1_tr[tr1_count].style.display = "none";
        }
    }
    button_add_tr.onclick = () => {
        if (tr1_count < 8) {
            list1_tr[tr1_count].style.display = "table-row";
            tr1_count++;
        }
    };

    button1_add_tr.onclick = () => {
        if (tr2_count < 8) {
            list2_tr[tr2_count].style.display = "table-row";
            tr2_count++;
        }
    };
    button1_delete_tr.onclick = () => {
        if (tr2_count > 1) {
            tr2_count--;
            list2_tr[tr2_count].style.display = "none";
        }
    }
}


