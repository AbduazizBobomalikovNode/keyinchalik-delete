from docxtpl import DocxTemplate
import json  # JSON ma'lumotlarini ishlash uchun import qilish
import os


data_path = os.path.join(os.path.dirname(__file__), "../config/data.json")

data = {}

with open(data_path, "r") as json_file:
    data = json.load(json_file)  # JSON ma'lumotlarini o‘qish

file_path = os.path.join(os.path.dirname(__file__), data["input_temp"] or "../template/ilova_uz_end.docx")

doc = DocxTemplate(file_path)

context = data

doc.render(context)



doc.save(data["output_temp"] or "output.docx")
print("yozildi!")
