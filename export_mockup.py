from pathlib import Path
import base64,re,zipfile,mimetypes
ROOT=Path(__file__).resolve().parent
DIST=ROOT/'dist'
OUT=ROOT/'output/website-so-tay-ai'
OUT.mkdir(parents=True,exist_ok=True)
html=(DIST/'index.html').read_text()
css=(DIST/'styles.css').read_text()
def data_url(path):
    mime=mimetypes.guess_type(path.name)[0] or 'application/octet-stream'
    if path.suffix=='.ttf':mime='font/ttf'
    return 'data:'+mime+';base64,'+base64.b64encode(path.read_bytes()).decode()
for name in re.findall(r'url\((assets/[^)]+)\)',css):css=css.replace('url('+name+')','url('+data_url(DIST/name)+')')
html=html.replace('<link rel="stylesheet" href="styles.css">','<style>'+css+'</style>')
for filename in ['prompt-data.js','lesson-data.js','app.js']:
    js=(DIST/filename).read_text()
    for name in set(re.findall(r'assets/[A-Za-z0-9_./-]+\.(?:svg|pdf|docx)',js)):
        path=DIST/name
        assert path.is_file(),name
        js=js.replace(name,data_url(path))
    html=html.replace('<script src="'+filename+'"></script>','<script>'+js.replace('</script','<\\/script')+'</script>')
assert not re.search(r'<script[^>]+src=',html)
assert not re.search(r'url\(assets/',html)
assert not re.search(r'(?:src|href)="assets/',html)
file=OUT/'So_Tay_Dien_Tu_AI_Mockup_V3.html'
file.write_text(html)
(DIST/'mockup.html').write_text(html)
with zipfile.ZipFile(OUT/'So_Tay_Dien_Tu_AI_Source_V3.zip','w',zipfile.ZIP_DEFLATED) as z:
    for p in DIST.rglob('*'):
        if p.is_file():z.write(p,Path('so-tay-ai')/p.relative_to(DIST))
    z.writestr('so-tay-ai/HUONG_DAN.txt','SỔ TAY ĐIỆN TỬ AI — MOCKUP V3\n\nMở index.html bằng trình duyệt hoặc đưa cả thư mục lên hosting tĩnh.\nFile HTML tự chứa: So_Tay_Dien_Tu_AI_Mockup_V3.html.\n\nGồm trang bìa, giới thiệu đề tài, 80 câu lệnh có bộ lọc môn/lớp/mục đích và sao chép, biểu mẫu cá nhân hóa, hướng dẫn5bước, 6 bài tham khảo và phiếu/câu hỏi/điều chỉnh vùngcao, danh sách kiểmtra, hướngdẫnPDF/Word.\n\nNội dung mẫu cần rà soát chuyên môn. Chưa kết nối API AI. Nhóm/đơnvị/địabàn cụ thể đang cập nhật.\n')
print(f'Standalone HTML: {file} ({file.stat().st_size:,} bytes)')
