'use strict';
(()=>{
const defaults={productTitle:'Sổ tay hướng dẫn giáo viên Tiểu học ứng dụng AI trong xây dựng kế hoạch bài dạy phù hợp với điều kiện thực tế',researchTitle:'Sổ tay hướng dẫn giáo viên Tiểu học ứng dụng AI trong xây dựng kế hoạch bài dạy phù hợp với điều kiện thực tế',groupName:'Đang cập nhật',organization:'Đang cập nhật',applicationArea:'Đang cập nhật',introduction:'Đề tài hướng đến xây dựng một sổ tay điện tử giúp giáo viên Tiểu học sử dụng AI để đề xuất ý tưởng, xây dựng bản dự thảo, điều chỉnh và hoàn thiện kế hoạch bài dạy theo điều kiện thực tế. Giáo viên chủ động lựa chọn câu lệnh, cung cấp bối cảnh lớp học và kiểm tra nội dung trước khi sử dụng.',applicationDescription:'Định hướng ứng dụng tại các trường Tiểu học ở địa bàn miền núi, vùng khó khăn, nơi còn hạn chế về thiết bị, học liệu và điều kiện kết nối. Tên trường, địa bàn khảo sát và thông tin triển khai cụ thể sẽ được bổ sung theo hồ sơ của nhóm nghiên cứu.'};
const key='sotay-research-config-v4';const limits={productTitle:500,researchTitle:500,groupName:250,organization:250,applicationArea:250,introduction:3000,applicationDescription:3000};
function clean(v){const out={};for(const k of Object.keys(defaults)){out[k]=typeof v?.[k]==='string'?v[k].trim().slice(0,limits[k]):defaults[k]}if(!out.productTitle)out.productTitle=defaults.productTitle;return out}
function get(){try{return clean({...defaults,...JSON.parse(localStorage.getItem(key)||'{}')})}catch{return {...defaults}}}
function save(value){const v=clean(value);localStorage.setItem(key,JSON.stringify(v));window.dispatchEvent(new CustomEvent('research-config-changed',{detail:v}));return v}
function reset(){localStorage.removeItem(key);const v=get();window.dispatchEvent(new CustomEvent('research-config-changed',{detail:v}));return v}
window.RESEARCH_CONFIG={defaults:{...defaults},get,save,reset};
})();
