/*
 * Mở Lớp — Kho kế hoạch bài dạy minh họa.
 * Nội dung biên soạn để tham khảo cấu trúc của Phụ lục 3, Công văn
 * 2345/BGDĐT-GDTH ngày 07/6/2021; chưa được thẩm định chuyên môn.
 * Giáo viên đối chiếu yêu cầu cần đạt, kế hoạch giáo dục của nhà trường,
 * kế hoạch của tổ chuyên môn, sách giáo khoa và điều kiện thực tế trước khi dùng.
 * goals là chuỗi; grade, duration và activities[].minutes là số.
 */
window.LESSON_LIBRARY = [
  {
    id: 'toan-3-chu-vi',
    title: 'Chu vi hình chữ nhật từ tấm bìa',
    subject: 'Toán',
    grade: 3,
    duration: 35,
    summary: 'Đo tấm bìa, đi theo đường bao và tìm cách tính chu vi. Có bài tập với số đo cùng đơn vị, không cần trình chiếu.',
    conditions: ['Không máy chiếu', 'Không máy in', 'Học liệu địa phương', 'Có thể hỗ trợ tiếng Việt'],
    goals: 'Mục tiêu minh họa, cần giáo viên đối chiếu yêu cầu cần đạt của Chương trình GDPT 2018, kế hoạch tổ chuyên môn và sách giáo khoa đang dùng.\n• Học sinh chỉ được đường bao của hình chữ nhật và giải thích chu vi là độ dài đường bao đó.\n• Tính được chu vi hình chữ nhật khi biết chiều dài, chiều rộng cùng đơn vị; giải thích cách cộng bốn cạnh hoặc cách tính (dài + rộng) × 2.\n• Hợp tác đo, ghi số đo và kiểm tra kết quả; có cơ hội phát triển năng lực giải quyết vấn đề và tính cẩn thận.',
    materials: [
      'Bảng, phấn; giáo viên viết sẵn ba nhiệm vụ luyện tập.',
      'Mỗi nhóm 4 học sinh: một thước có vạch xăng-ti-mét và một tấm bìa hình chữ nhật được giáo viên chuẩn bị khoảng 8 cm × 5 cm.',
      'Vở, bút; không bắt buộc phát phiếu in. Giáo viên đo lại bìa thật trước tiết học.'
    ],
    activities: [
      {
        name: 'Mở đầu — Đi theo đường bao',
        minutes: 5,
        teacher: 'Giơ tấm bìa và dùng ngón tay đi một vòng theo bốn cạnh, trở lại điểm bắt đầu. Hỏi muốn biết độ dài đường bao phải biết những độ dài nào. Nhắc lại cách đặt đầu thước ở vạch 0; giao vai người đo, người giữ bìa, người ghi và người kiểm tra.',
        students: 'Chỉ đường bao trên bìa; gọi tên chiều dài, chiều rộng. Một học sinh làm mẫu đặt thước, các em khác nhận xét; nhận vai trong nhóm.',
        evidence: 'Học sinh đi đủ bốn cạnh và trở về điểm đầu; phân biệt đường bao với phần mặt bìa. Giáo viên sửa ngay thao tác đặt thước sai.'
      },
      {
        name: 'Khám phá — Từ bốn cạnh đến cách tính',
        minutes: 10,
        teacher: 'Cho nhóm đo hai kích thước và kiểm tra hai cạnh đối diện. Với bìa 8 cm × 5 cm, ghi 8 + 5 + 8 + 5 = 26 (cm); hỏi có thể nhóm các số hạng thế nào. Chốt cách tính khi các số đo cùng đơn vị, giải thích vì sao nhân 2.',
        students: 'Đo, ghi số đo có đơn vị; chỉ từng cạnh khi cộng. Trao đổi để viết (8 + 5) × 2 = 26 (cm); giải thích hai lần tổng chiều dài và chiều rộng bằng tổng bốn cạnh.',
        evidence: 'Nhóm nêu được 26 cm cho dữ kiện 8 cm và 5 cm. Nếu số đo bìa thật khác, học sinh tính theo số đo thật; giáo viên không ép kết quả thực đo bằng dữ kiện bài mẫu.'
      },
      {
        name: 'Luyện tập — Tính và sửa cách giải',
        minutes: 15,
        teacher: 'Dành 1 phút chép đề, 7 phút làm cá nhân, 4 phút đổi vở giải thích và 3 phút chữa bài. Dùng nhiệm vụ 1–2 của phiếu; với em cần hỗ trợ, cho viết đủ bốn số hạng trước. Giao nhiệm vụ 3 cho em hoàn thành sớm.',
        students: 'Tính chu vi hình 6 cm × 4 cm; phát hiện lời giải chỉ cộng hai cạnh. Đổi vở và chỉ cách kiểm tra; em hoàn thành sớm kiểm tra và giải thích hai hình đã cho có cùng chu vi.',
        evidence: 'Bài 1: (6 + 4) × 2 = 20 cm. Bài 2: 8 + 5 = 13 cm chưa phải chu vi; kết quả đúng 26 cm. Bài 3: 7 cm × 3 cm và 6 cm × 4 cm cùng có chu vi 20 cm.'
      },
      {
        name: 'Vận dụng — Nói cách kiểm tra của mình',
        minutes: 5,
        teacher: 'Cho từng cặp chọn một tấm bìa, nêu cách tìm độ dài đường bao và tự kiểm tra. Mời hai học sinh giải thích vì sao không chỉ lấy dài cộng rộng; thu nhanh kết quả của một số em còn nhầm đơn vị.',
        students: 'Một em nói hoặc viết cách tính, bạn còn lại chỉ bốn cạnh để kiểm tra. Cuối giờ ghi một điều đã hiểu và một điều còn cần giúp đỡ.',
        evidence: 'Học sinh dùng đúng đơn vị độ dài, giải thích được phép nhân 2; giáo viên có ghi chú cụ thể em nào còn nhầm chu vi với tổng hai cạnh.'
      }
    ],
    worksheet: 'PHIẾU THỰC HÀNH — CHU VI HÌNH CHỮ NHẬT\nCó thể chép đề lên bảng, học sinh làm trong vở. Không cần máy in.\n\n1. Một tấm bìa hình chữ nhật có chiều dài 6 cm, chiều rộng 4 cm. Tính chu vi.\nBài giải: ........................................................\n\n2. Với hình chữ nhật dài 8 cm, rộng 5 cm, bạn An viết: “Chu vi là 8 + 5 = 13 cm”. Em hãy chỉ ra phần còn thiếu và sửa lại.\nEm giải thích: ....................................................\n\n3. Nếu đã hoàn thành: Hình A dài 7 cm, rộng 3 cm. Hình B dài 6 cm, rộng 4 cm. Hai hình có cùng chu vi không? Giải thích bằng phép tính.\n\nTỰ KIỂM TRA: Tôi đã dùng đủ bốn cạnh chưa? Các số đo có cùng đơn vị chưa? Tôi đã viết đơn vị ở đáp số chưa?\n\nGỢI Ý DÀNH CHO GIÁO VIÊN\n1. (6 + 4) × 2 = 20 (cm).\n2. Phép tính của An mới tính một chiều dài và một chiều rộng; còn thiếu hai cạnh. Chu vi: (8 + 5) × 2 = 26 (cm).\n3. A: (7 + 3) × 2 = 20 (cm); B: (6 + 4) × 2 = 20 (cm), nên cùng chu vi. Không kết luận hai hình có cùng diện tích.',
    questions: [
      'Khi ngón tay đi hết một vòng quanh tấm bìa, em đã đi qua những cạnh nào?',
      'Vì sao phép tính dài cộng rộng chưa cho chu vi hình chữ nhật?',
      'Trong cách tính (dài + rộng) × 2, số 2 thể hiện điều gì?',
      'Hai hình có chiều dài khác nhau có thể cùng chu vi không? Hãy dùng ví dụ để giải thích.'
    ],
    adaptations: [
      'Thiếu thước: giáo viên cho các nhóm luân phiên đo một tấm bìa; nhóm đang chờ làm bài có số đo ghi sẵn. Không thay số đo bằng ước lượng rồi xem đó là kết quả chính xác.',
      'Cần hỗ trợ tiếng Việt: chỉ lần lượt từng cạnh, viết khung câu “Em cộng ... vì ...”; cho trao đổi theo cặp trước khi giải thích trước lớp.',
      'Thiếu giấy hoặc máy in: giáo viên viết ba đề ngắn trên bảng, học sinh chỉ ghi phép tính và câu giải thích vào vở.',
      'Không gian hẹp hoặc thời tiết bất lợi: đo bìa tại bàn, không tổ chức đi quanh sân hoặc di chuyển đến đồ vật ngoài lớp.',
      'Sau bài dạy, giáo viên ghi số em còn quên nhân 2 hoặc thiếu đơn vị, hoạt động đo mất bao nhiêu phút và cách điều chỉnh hỗ trợ ở lần dạy sau.'
    ],
    review: [
      'Đối chiếu mục tiêu minh họa và vị trí bài trong chương trình, sách giáo khoa, kế hoạch của tổ chuyên môn; thay bằng yêu cầu cần đạt đã xác minh.',
      'Tự tính lại 20 cm, 26 cm và 20 cm trước khi dùng; đối chiếu số đo trên bìa thật. Không lấy lời xác nhận của AI thay cho việc tự giải.',
      'Có thể yêu cầu AI: “Rà soát phép tính, đơn vị và cách giải thích chu vi trong kế hoạch này; chỉ rõ điểm nghi ngờ, không tự thay dữ kiện.” Giáo viên so từng đề xuất với lời giải của mình.',
      'Nếu AI gợi ý xem video, in phiếu hoặc đo sân trường, thay bằng bìa tại bàn đúng danh sách học liệu; giữ mục tiêu cốt lõi và tổng 35 phút.',
      'Trước khi dạy, đánh dấu từng đề xuất AI: giữ, sửa hoặc bỏ, kèm lý do. Sau tiết dạy bổ sung điều chỉnh từ kết quả quan sát học sinh.'
    ]
  },
  {
    id: 'tieng-viet-2-do-vat',
    title: 'Nói về một đồ vật quen thuộc',
    subject: 'Tiếng Việt',
    grade: 2,
    duration: 35,
    summary: 'Quan sát đồ vật thật, chuẩn bị ý bằng từ khóa và luyện nói theo cặp. Học sinh có thể dùng vật do giáo viên chuẩn bị.',
    conditions: ['Không máy chiếu', 'Không máy in', 'Hỗ trợ tiếng Việt', 'Đồ vật sẵn có'],
    goals: 'Mục tiêu minh họa, cần giáo viên đối chiếu yêu cầu cần đạt về nói và nghe của lớp 2, sách giáo khoa và kế hoạch tổ chuyên môn.\n• Học sinh nói được một đoạn ngắn, gợi ý khoảng 3–4 câu, về tên, đặc điểm, công dụng và cách giữ gìn một đồ vật quen thuộc; giáo viên điều chỉnh độ dài theo yêu cầu đã xác minh.\n• Lắng nghe bạn, nêu lại một ý đã nghe hoặc đặt một câu hỏi liên quan.\n• Có cơ hội phát triển giao tiếp, hợp tác và ý thức giữ gìn đồ dùng; không đánh giá năng lực từ giá trị hoặc việc sở hữu đồ vật.',
    materials: [
      'Bảng, phấn; bốn từ khóa: Tên — Đặc điểm — Công dụng — Giữ gìn.',
      'Một chiếc cốc nhựa sạch, một chiếc thước và một quyển vở do giáo viên chuẩn bị; có thể thay bằng đồ an toàn sẵn có.',
      'Vở và bút để ghi từ khóa hoặc vẽ nhanh; không yêu cầu học sinh mang đồ riêng hay mua đồ.'
    ],
    activities: [
      {
        name: 'Mở đầu — Đoán đồ vật qua đặc điểm',
        minutes: 5,
        teacher: 'Mô tả ngắn chiếc thước nhưng chưa gọi tên: có vạch số, thường dùng khi học Toán. Cho học sinh đoán và chỉ đồ vật thật; hỏi thông tin nào giúp em nhận ra. Giới thiệu mục đích nói để bạn hình dung được đồ vật.',
        students: 'Quan sát, đoán tên và nêu đặc điểm giúp mình nhận ra; có thể chỉ đồ vật trước khi nói thành câu.',
        evidence: 'Học sinh gọi đúng tên hoặc chỉ đúng đồ vật và nêu được ít nhất một dấu hiệu quan sát được.'
      },
      {
        name: 'Khám phá — Sắp xếp ý để nói',
        minutes: 8,
        teacher: 'Làm mẫu với chiếc cốc trong 3–4 câu tự nhiên; chỉ ra bốn nhóm ý trên bảng. Nhấn mạnh đây là ví dụ, học sinh dùng cách nói riêng. Cho cặp quan sát một vật, chọn hai đặc điểm thật và ghi hoặc vẽ từ khóa.',
        students: 'Nghe mẫu, chỉ ra tên, đặc điểm, công dụng và cách giữ gìn. Chọn chiếc thước, quyển vở hoặc chiếc cốc chung; chuẩn bị ý bằng từ khóa, hình vẽ hoặc lời nói.',
        evidence: 'Mỗi em có ý để nói về một vật cụ thể; đặc điểm phù hợp với vật đang quan sát, không sao chép thuộc lòng toàn bộ lời mẫu.'
      },
      {
        name: 'Luyện tập — Nói và nghe theo cặp',
        minutes: 15,
        teacher: 'Chia 2 phút chuẩn bị, 6 phút hai lượt nói–nghe, 4 phút mời vài em trình bày và 3 phút góp ý. Dùng tiêu chí: có tên vật, thông tin phù hợp, lời nói đủ nghe, biết nghe bạn. Gợi ý câu hỏi thay vì sửa hết lời học sinh.',
        students: 'Lần lượt nói về vật đã chọn. Người nghe nêu lại một ý đã nghe hoặc hỏi thêm một câu; đổi vai. Một số em tự nguyện trình bày, các em khác góp ý một điểm rõ và một ý có thể bổ sung.',
        evidence: 'Giáo viên ghi nhanh mức hỗ trợ của từng em; quan sát đủ hai lượt trong cặp, không chỉ nghe những em nói trước lớp. Nội dung nói đúng với đồ vật thật.'
      },
      {
        name: 'Vận dụng — Nói lại rõ hơn',
        minutes: 7,
        teacher: 'Cho học sinh chọn một góp ý và nói lại với bạn. Mời người nghe xác nhận điều mình hiểu hơn; chốt cách giữ gìn đồ dùng. Thu hai hoặc ba từ khóa của em cần hỗ trợ để chuẩn bị lần luyện tiếp theo.',
        students: 'Bổ sung một đặc điểm, công dụng hoặc cách giữ gìn còn thiếu; nói lại bằng lời của mình. Nêu một việc cụ thể có thể làm sau tiết học để giữ đồ dùng bền.',
        evidence: 'Học sinh cải thiện được ít nhất một ý hoặc cách diễn đạt; người nghe nêu đúng một thông tin. Không dùng độ trôi chảy tiếng Việt làm căn cứ duy nhất nhận xét mức hiểu.'
      }
    ],
    worksheet: 'PHIẾU GỢI Ý NÓI VÀ NGHE — ĐỒ VẬT QUEN THUỘC\nHọc sinh có thể ghi từ khóa, vẽ hoặc trả lời miệng; không cần chép cả phiếu.\n\nA. CHUẨN BỊ NÓI\nTên đồ vật em chọn: ..............................................\nEm quan sát thấy: ................................................\nĐồ vật được dùng để: .............................................\nEm giữ gìn bằng cách: ............................................\n\nKhung câu nếu cần: “Đây là ...”; “Đồ vật có ...”; “Em dùng để ...”; “Em giữ gìn bằng cách ...”. Em có thể nói theo cách khác.\n\nB. LẮNG NGHE BẠN\nMột ý em đã nghe: ................................................\nMột điều em muốn hỏi thêm: .......................................\nSau góp ý, em muốn nói rõ hơn về: ................................\n\nGỢI Ý DÀNH CHO GIÁO VIÊN\nVí dụ với chiếc thước: “Đây là chiếc thước của lớp. Thước có các vạch chia và chữ số. Em dùng thước để đo độ dài, kẻ đoạn thẳng. Em cất thước gọn và không bẻ cong.” Chấp nhận cách nói khác phù hợp vật thật; không coi đây là đáp án phải học thuộc.',
    questions: [
      'Em muốn giới thiệu đồ vật nào? Đặc điểm nào giúp bạn nhận ra nó?',
      'Đồ vật đó dùng để làm gì? Em đã quan sát thấy điều ấy ở đâu?',
      'Em sẽ làm gì để đồ vật dùng được lâu?',
      'Em vừa nghe bạn nói điều gì? Em muốn hỏi thêm câu nào có liên quan?'
    ],
    adaptations: [
      'Cần hỗ trợ tiếng Việt: cho chỉ vật, vẽ và nói từ khóa trước; giáo viên làm mẫu một câu ngắn rồi giảm dần khung câu. Nếu có người hỗ trợ ngôn ngữ phù hợp, làm rõ nhiệm vụ bằng ngôn ngữ học sinh hiểu trước khi luyện tiếng Việt.',
      'Học sinh chưa tự tin: luyện với bạn quen trước, có thể cầm đồ vật để nói; không ép mọi em trình bày trước cả lớp ngay trong tiết này.',
      'Thiếu đồ vật hoặc không thể mang đồ từ nhà: luân phiên quan sát ba vật chung của lớp; chấp nhận nói về cùng một vật với cách diễn đạt riêng.',
      'Không máy in: viết bốn từ khóa lên bảng; học sinh vẽ một hình và ghi vài từ vào vở, dành thời gian chính cho nói–nghe.',
      'Sau bài dạy, giáo viên ghi em nào cần thêm từ vựng, khung câu hoặc thời gian luyện; điều chỉnh số câu và hình thức chia sẻ theo minh chứng quan sát.'
    ],
    review: [
      'Đối chiếu mục tiêu và chủ đề nói–nghe với chương trình, bài trong sách giáo khoa đang dùng; không xem mức 3–4 câu của ví dụ là yêu cầu bắt buộc cho mọi lớp.',
      'Nếu dùng AI tạo đoạn mẫu, kiểm tra câu ngắn, nghĩa rõ, đặc điểm đúng với đồ thật; loại chi tiết AI tự thêm như chất liệu hoặc công dụng chưa quan sát được.',
      'Yêu cầu AI: “Rút ngắn chỉ dẫn thành từng bước, giữ nhiệm vụ nói–nghe và đề xuất cách hỗ trợ mà không viết hộ toàn bộ câu trả lời.” Giáo viên thử đọc chỉ dẫn trước khi chọn.',
      'Loại hoạt động buộc học sinh mua hoặc trưng bày đồ riêng; không yêu cầu tên, hoàn cảnh hay thông tin nhận diện học sinh trong câu lệnh AI.',
      'Đối chiếu bảng quan sát với cả việc nói và việc nghe; giữ, sửa hoặc bỏ gợi ý AI theo mức tham gia thực tế của học sinh rồi ghi điều chỉnh sau giờ học.'
    ]
  },
  {
    id: 'tnxh-3-cay-quanh-truong',
    title: 'Quan sát các bộ phận của cây quanh trường',
    subject: 'Tự nhiên và Xã hội',
    grade: 3,
    duration: 35,
    summary: 'Quan sát cây hoặc mẫu vật an toàn, ghi bằng hình vẽ và đối chiếu điều thật sự nhìn thấy. Có phương án học trong lớp khi mưa hoặc sân không an toàn.',
    conditions: ['Học liệu địa phương', 'Không thiết bị số', 'Có phương án trời mưa', 'Có thể hỗ trợ tiếng Việt'],
    goals: 'Mục tiêu minh họa, cần giáo viên đối chiếu yêu cầu cần đạt về thực vật trong chương trình, sách giáo khoa và kế hoạch tổ chuyên môn.\n• Học sinh nhận biết, chỉ hoặc ghi chú được một số bộ phận của cây qua quan sát như rễ, thân, lá; nêu rõ bộ phận chưa nhìn thấy thay vì đoán.\n• Ghi lại ít nhất hai đặc điểm quan sát được và trao đổi kết quả với bạn; không khẳng định mọi cây đều có hoa, quả tại thời điểm quan sát.\n• Có cơ hội phát triển năng lực tìm hiểu môi trường tự nhiên, hợp tác và giữ gìn cây; thực hiện quy tắc quan sát an toàn.',
    materials: [
      'Bảng, phấn; vở và bút để vẽ hoặc ghi chú.',
      'Một cây quen thuộc do giáo viên kiểm tra trước ở vị trí bằng phẳng, gần lớp; không chọn cây có gai, quả lạ hoặc vị trí gần dốc, suối, đường xe.',
      'Một cây nhỏ còn nguyên rễ trong chậu trong suốt hoặc mẫu cây an toàn do giáo viên chuẩn bị, kèm hình rễ vẽ trên bảng nếu rễ không nhìn thấy. Không yêu cầu học sinh nhổ cây.'
    ],
    activities: [
      {
        name: 'Mở đầu — Nêu điều muốn quan sát',
        minutes: 4,
        teacher: 'Giới thiệu cây đã chọn; hỏi học sinh muốn biết điều gì về các bộ phận của cây. Nêu ba quy tắc: đi cùng nhóm trong phạm vi cho phép, không nếm hoặc chạm cây lạ, không bẻ hay nhổ cây.',
        students: 'Nêu tên bộ phận mình biết; nhắc lại một quy tắc và nhận nhiệm vụ quan sát theo cặp.',
        evidence: 'Học sinh phân biệt nhiệm vụ quan sát với hái, nhổ cây; nói hoặc chỉ được phạm vi hoạt động đã thống nhất.'
      },
      {
        name: 'Khám phá — Quan sát có căn cứ',
        minutes: 10,
        teacher: 'Dành 2 phút ổn định vị trí, 6 phút quan sát và 2 phút trở lại chỗ học. Chỉ dẫn nhìn từ toàn cây đến thân, lá; muốn quan sát rễ dùng mẫu đã chuẩn bị hoặc hình vẽ và nói rõ nguồn. Trời mưa hoặc vị trí không an toàn thì dùng mẫu tại bàn trong cùng khoảng thời gian.',
        students: 'Quan sát bằng mắt, chỉ cho bạn bộ phận nhìn thấy và ghi hai đặc điểm. Nếu không thấy rễ, hoa hoặc quả, ghi “chưa quan sát được” thay vì tự thêm.',
        evidence: 'Mỗi cặp có ít nhất hai ghi nhận dựa trên vật thật, ví dụ thân có màu nâu, lá có gân; phân biệt rễ nhìn từ mẫu/hình với phần nhìn thấy trên cây ngoài sân.'
      },
      {
        name: 'Luyện tập — Vẽ, ghi chú và giải thích',
        minutes: 15,
        teacher: 'Cho 7 phút vẽ và ghi chú theo phiếu, 4 phút trao đổi cặp, 4 phút chia sẻ và sửa. Khi học sinh thêm hoa, quả không quan sát được, hỏi nguồn thông tin. Chốt tên bộ phận dựa trên mẫu cụ thể, tránh suy rộng từ một cây.',
        students: 'Vẽ đơn giản cây hoặc mẫu vừa quan sát; ghi tên bộ phận bằng từ hoặc mũi tên. So với ghi chép của bạn, bổ sung phần có căn cứ và đánh dấu phần chưa thấy.',
        evidence: 'Hình hoặc lời trình bày gắn được tên thân, lá với bộ phận tương ứng. Nếu thể hiện rễ từ hình vẽ của giáo viên, học sinh ghi nguồn thay vì nói đã thấy rễ ngoài sân.'
      },
      {
        name: 'Vận dụng — Chăm cây từ điều đã biết',
        minutes: 6,
        teacher: 'Đưa tình huống bạn muốn bẻ cành để đem vào lớp hoặc muốn nếm quả lạ; yêu cầu đề xuất cách quan sát khác. Cho mỗi cặp nêu một việc giữ gìn cây phù hợp và thu ghi chép để xác định chỗ còn nhầm.',
        students: 'Nêu cách nhìn gần trong phạm vi an toàn, vẽ hoặc dùng mẫu giáo viên chuẩn bị; chọn việc không giẫm lên gốc, không bẻ cành. Nói điều còn muốn tìm hiểu.',
        evidence: 'Học sinh chọn được cách quan sát không gây hại cây, không nếm vật lạ; giải thích một việc mình có thể làm trong điều kiện của lớp.'
      }
    ],
    worksheet: 'PHIẾU QUAN SÁT — CÂY QUANH TRƯỜNG\nLàm trong vở bằng chữ hoặc hình vẽ. Không hái, nhổ hay nếm cây.\n\n1. Cây hoặc mẫu em quan sát: ......................................\nNơi quan sát: [ ] gần lớp  [ ] mẫu trong lớp  [ ] hình giáo viên vẽ\n\n2. Vẽ nhanh và dùng mũi tên ghi tên bộ phận em thấy.\nThân: em thấy ...................................................\nLá: em thấy .....................................................\nRễ: [ ] thấy từ mẫu  [ ] xem qua hình  [ ] chưa quan sát được\nHoa/quả: [ ] có nhìn thấy  [ ] chưa nhìn thấy trong lần quan sát này\n\n3. Hai điều em quan sát được:\n• ................................................................\n• ................................................................\n\n4. Một việc em làm để giữ gìn cây: ................................\nMột điều em cần hỏi thêm: ........................................\n\nGỢI Ý DÀNH CHO GIÁO VIÊN\nKhông có một hình cây duy nhất làm đáp án. Đối chiếu hình và ghi chép với cây, mẫu hoặc hình đã dùng. Chấp nhận “chưa quan sát được”. Không sửa thành “cây không có rễ/hoa/quả” chỉ vì học sinh không nhìn thấy trong lần này.',
    questions: [
      'Em đang chỉ bộ phận nào? Điều gì em thật sự nhìn thấy giúp em mô tả nó?',
      'Em đã nhìn thấy rễ ở đâu: cây ngoài sân, mẫu trong lớp hay hình trên bảng?',
      'Lần này không thấy hoa hoặc quả có đủ để nói cây ấy không bao giờ có hoa, quả không?',
      'Em có thể quan sát và giữ gìn cây bằng cách nào mà không bẻ, nhổ hoặc nếm cây?'
    ],
    adaptations: [
      'Mưa, rét, sân trơn hoặc đường đi có dốc: học tại bàn với mẫu giáo viên chuẩn bị và hình trên bảng; không xem hoạt động ngoài trời là bắt buộc.',
      'Không có mẫu thấy rễ: giáo viên vẽ sơ đồ và nói rõ đó là hình hỗ trợ, cho học sinh phân biệt với quan sát cây thật; không nhổ cây để lấy rễ.',
      'Cần hỗ trợ tiếng Việt: dùng mũi tên, nhãn rễ–thân–lá và khung “Em thấy ...”; cho học sinh chỉ hoặc vẽ trước khi giải thích.',
      'Lớp đông hoặc ít mẫu vật: quan sát luân phiên theo nhóm nhỏ, nhóm chờ vẽ phần đã thấy; dùng cùng tiêu chí cho các nhóm.',
      'Sau bài dạy, ghi các tên bộ phận còn nhầm, phần học sinh suy đoán thiếu căn cứ và mức phù hợp của vị trí quan sát để điều chỉnh lần sau.'
    ],
    review: [
      'Đối chiếu mục tiêu và tên bài với chương trình, sách giáo khoa đang sử dụng; không dùng ví dụ này để thay yêu cầu cần đạt đã được xác định.',
      'Nếu AI mô tả tên loài hoặc công dụng của cây địa phương, xác minh bằng nguồn chuyên môn hoặc người có chuyên môn; bỏ chi tiết chưa xác định. Không nhận dạng cây chỉ bằng suy đoán của AI.',
      'Yêu cầu AI: “Tách điều quan sát được khỏi điều suy luận trong bản ghi này; chỉ rõ thông tin còn thiếu, không tự điền tên loài hoặc bộ phận chưa thấy.” Giáo viên đối chiếu từng ý với mẫu thật.',
      'Kiểm tra mọi chỉ dẫn không yêu cầu nếm cây, chạm cây lạ, leo trèo hoặc tự nhổ cây; tự kiểm tra địa điểm và phương án trong lớp trước giờ học.',
      'Kiểm tra 4 + 10 + 15 + 6 = 35 phút, gồm cả di chuyển. Sau giờ học chọn điều cần sửa từ hình vẽ và lời giải thích của học sinh, không từ lời khẳng định “đã đúng” của AI.'
    ]
  },
  {
    id: 'toan-4-phan-so',
    title: 'Đọc và biểu diễn phân số bằng băng giấy',
    subject: 'Toán',
    grade: 4,
    duration: 35,
    summary: 'Gấp băng giấy thành các phần bằng nhau để đọc, viết và giải thích phân số. Làm rõ phần bằng nhau và đơn vị toàn thể.',
    conditions: ['Không máy chiếu', 'Không máy in', 'Giấy tái sử dụng', 'Có thể hỗ trợ tiếng Việt'],
    goals: 'Mục tiêu minh họa, cần giáo viên đối chiếu yêu cầu cần đạt về phân số của lớp 4, bài học trong sách giáo khoa và kế hoạch tổ chuyên môn.\n• Với hình chia thành các phần bằng nhau, học sinh đọc, viết được phân số biểu thị số phần được chọn.\n• Giải thích được mẫu số là số phần bằng nhau của một toàn thể và tử số là số phần đang được xét trong ví dụ cụ thể.\n• Nhận ra hình chia không đều chưa đủ căn cứ để ghi phân số theo số phần đếm được; có cơ hội phát triển lập luận toán học, hợp tác và sự chính xác.',
    materials: [
      'Bảng, phấn; giáo viên vẽ trước một hình chia 4 phần bằng nhau và một hình chia 4 phần không bằng nhau.',
      'Mỗi cặp: hai băng giấy hình chữ nhật cùng kích thước, sạch và còn dùng được; bút chì hoặc bút màu. Giáo viên chuẩn bị trước, không cần học sinh dùng kéo.',
      'Vở để viết phân số dạng tử số trên gạch ngang mẫu số; có thể dùng ký hiệu 3/4 khi ghi văn bản.'
    ],
    activities: [
      {
        name: 'Mở đầu — Một băng giấy, nhiều phần',
        minutes: 5,
        teacher: 'Giơ một băng giấy nguyên và xác định đó là một toàn thể trong bài học. Gấp đôi, mở ra và hỏi hai phần có bằng nhau không; dùng chồng khít để kiểm tra. Giới thiệu nhiệm vụ tìm cách ghi số phần được chọn.',
        students: 'Chỉ toàn thể, quan sát cách kiểm tra hai phần bằng nhau; dự đoán nếu gấp đôi thêm một lần thì có mấy phần.',
        evidence: 'Học sinh xác định được băng giấy nguyên là toàn thể và nhận ra đếm số phần phải gắn với điều kiện các phần bằng nhau.'
      },
      {
        name: 'Khám phá — Tử số và mẫu số',
        minutes: 10,
        teacher: 'Cho cặp gấp băng giấy làm tư, mở ra kiểm tra bốn phần bằng nhau rồi đánh dấu 3 phần. Viết 3/4, đọc “ba phần tư”; chỉ rõ 4 phần bằng nhau tạo thành toàn thể, đang xét 3 phần. Đưa hình chia 4 phần không đều để đối chiếu.',
        students: 'Gấp, kiểm tra và đánh dấu; giải thích số 3, số 4 bằng cách chỉ trên băng giấy. Nêu vì sao không thể chỉ đếm ba trong bốn vùng không đều rồi gọi ngay là 3/4 toàn thể.',
        evidence: 'Học sinh đọc được 3/4 và giải thích đúng hai số trong ví dụ. Giáo viên xác minh các nếp gấp đủ rõ, không coi hình chia tùy ý là các phần bằng nhau.'
      },
      {
        name: 'Luyện tập — Đọc hình, tạo hình',
        minutes: 15,
        teacher: 'Dành 2 phút giao đề, 8 phút làm phiếu trong vở và với băng giấy thứ hai, 5 phút trao đổi chữa bài. Với nhiệm vụ chia 8 phần, hướng dẫn gấp đôi liên tiếp ba lần nếu cần; cho nhóm chưa gấp được dùng hình giáo viên vẽ sẵn.',
        students: 'Ghi phân số cho 2 trong 4 phần bằng nhau và 3 trong 8 phần bằng nhau. Biểu diễn 1/4 bằng cách đánh dấu đúng một phần của băng giấy chia tư; giải thích cho bạn.',
        evidence: 'Đáp án lần lượt 2/4 và 3/8; biểu diễn 1/4 có toàn thể chia 4 phần bằng nhau, đúng 1 phần được đánh dấu. Không bắt buộc rút gọn 2/4 trong tiết minh họa này.'
      },
      {
        name: 'Vận dụng — Kiểm tra một lời giải thích',
        minutes: 5,
        teacher: 'Nêu câu “Cứ chia giấy thành bốn vùng rồi tô một vùng thì luôn được 1/4”. Yêu cầu học sinh dùng hai hình đã chuẩn bị để đồng ý hoặc sửa lại; thu câu trả lời ngắn của từng em.',
        students: 'Chỉ điều kiện bốn phần phải bằng nhau; nói hoặc viết lại câu đúng. Nêu một cách kiểm tra phần bằng nhau bằng gấp hoặc chồng khít.',
        evidence: 'Học sinh bổ sung được điều kiện bằng nhau và xác định được toàn thể; giáo viên ghi em nào còn lẫn ý nghĩa tử số, mẫu số để hỗ trợ sau tiết học.'
      }
    ],
    worksheet: 'PHIẾU THỰC HÀNH — PHÂN SỐ TRÊN BĂNG GIẤY\nQuy ước: mỗi băng giấy nguyên là một toàn thể. Các phần phải bằng nhau.\n\n1. Băng A chia thành 4 phần bằng nhau, đánh dấu 2 phần.\nViết phân số: ..........  Đọc: ..................................\n\n2. Băng B chia thành 8 phần bằng nhau, đánh dấu 3 phần.\nViết phân số: ..........\nMẫu số cho biết: ................................................\nTử số cho biết: .................................................\n\n3. Gấp hoặc vẽ một băng giấy chia 4 phần bằng nhau. Đánh dấu để biểu diễn 1/4. Chỉ cho bạn đâu là toàn thể, đâu là phần được chọn.\n\n4. Bạn nói: “Chia giấy thành bốn vùng bất kỳ, tô một vùng là 1/4”. Em sửa câu này thế nào?\n..................................................................\n\nGỢI Ý DÀNH CHO GIÁO VIÊN\n1. 2/4; đọc “hai phần tư”. Chưa yêu cầu rút gọn trong nhiệm vụ này.\n2. 3/8; mẫu số 8 chỉ toàn thể được chia thành 8 phần bằng nhau, tử số 3 chỉ 3 phần đang xét.\n3. Toàn thể có 4 phần bằng nhau, 1 phần được đánh dấu.\n4. Phải chia toàn thể thành 4 phần bằng nhau rồi chọn 1 phần. Không kết luận từ việc chỉ đếm số vùng trên hình.',
    questions: [
      'Trong ví dụ này, vật nào được coi là một toàn thể?',
      'Làm thế nào em biết các phần của băng giấy bằng nhau?',
      'Số 3 và số 4 trong 3/4 cho biết điều gì khi chỉ trên băng giấy?',
      'Vì sao hình có bốn vùng nhưng các vùng không bằng nhau chưa thể dùng ngay để biểu diễn một phần tư?'
    ],
    adaptations: [
      'Thiếu giấy: mỗi cặp dùng một băng giấy chia tư; nhiệm vụ tám phần thực hiện trên hình giáo viên vẽ sẵn trên bảng. Không yêu cầu mua giấy màu.',
      'Học sinh khó thao tác gấp: dùng băng có nếp gấp do giáo viên chuẩn bị; học sinh vẫn tự chỉ toàn thể, đếm số phần và giải thích phân số.',
      'Cần hỗ trợ tiếng Việt: dùng màu hoặc nét gạch để nối lời nói với hình; khung câu “Có ... phần bằng nhau, chọn ... phần, viết ...”.',
      'Hoàn thành sớm: tự biểu diễn 3/4 bằng hình chữ nhật khác và giải thích điều kiện bằng nhau; không đưa thêm phép tính phân số khi chưa nằm trong mục tiêu đã đối chiếu.',
      'Sau bài dạy, ghi em nào còn đếm vùng không đều hoặc đảo tử số/mẫu số; điều chỉnh mẫu giấy và thời gian giải thích ở lần dạy tiếp theo.'
    ],
    review: [
      'Đối chiếu mục tiêu và phạm vi kiến thức phân số với kế hoạch lớp 4; ví dụ này không bao quát mọi yêu cầu của chủ đề phân số.',
      'Tự kiểm tra hình: có đúng 4 hoặc 8 phần bằng nhau, số phần đánh dấu khớp phân số. Không dùng hình AI tạo bị chia lệch mà vẫn ghi là bằng nhau.',
      'Yêu cầu AI: “Đối chiếu mô tả từng hình với phân số, nêu toàn thể, số phần bằng nhau và số phần được chọn; đánh dấu hình thiếu dữ kiện.” Giáo viên so lại với băng giấy thật.',
      'Loại lời giải thích coi mẫu số là số phần tô hoặc bỏ điều kiện bằng nhau; kiểm tra cách đọc 2/4, 3/8 và 1/4 trước khi ghi bảng.',
      'Giữ hoạt động trong 35 phút và chỉ dùng giấy, bút, bảng; lưu nhận xét sau bài dạy làm căn cứ sửa prompt ở lần tiếp theo.'
    ]
  },
  {
    id: 'dao-duc-2-giup-ban',
    title: 'Giúp bạn bằng việc vừa sức',
    subject: 'Đạo đức',
    grade: 2,
    duration: 35,
    summary: 'Thảo luận tình huống và đóng vai hỏi bạn cần gì, giúp bằng việc phù hợp hoặc nhờ người lớn. Dùng tình huống giả định, tránh nêu hoàn cảnh riêng của học sinh.',
    conditions: ['Không máy chiếu', 'Không máy in', 'Học theo cặp', 'Hỗ trợ tiếng Việt'],
    goals: 'Mục tiêu minh họa, cần giáo viên đối chiếu yêu cầu cần đạt của môn Đạo đức lớp 2, chủ đề trong sách giáo khoa và kế hoạch tổ chuyên môn.\n• Học sinh nhận ra một số tình huống bạn cần được quan tâm, hỗ trợ và nêu được việc vừa sức có thể làm.\n• Thực hành lời hỏi trước khi giúp, lời động viên và cách nhờ giáo viên khi vượt khả năng; tôn trọng lựa chọn và đồ dùng của bạn.\n• Có cơ hội phát triển phẩm chất nhân ái, trách nhiệm, năng lực giao tiếp và điều chỉnh hành vi; không đồng nhất giúp bạn với làm hộ hoặc đưa đáp án.',
    materials: [
      'Bảng, phấn; giáo viên viết hoặc đọc ba tình huống giả định trong phiếu.',
      'Một quyển vở, bút chì và vài tờ giấy sạch để đóng vai; dùng đồ chung, không cần trang phục hoặc đạo cụ riêng.',
      'Vở học sinh; có thể chọn phương án bằng giơ ngón tay hoặc trả lời miệng, không bắt buộc phiếu in.'
    ],
    activities: [
      {
        name: 'Mở đầu — Một lời hỏi có ích',
        minutes: 5,
        teacher: 'Kể tình huống giả định: giờ chuẩn bị học, Nam đang loay hoay nhặt những tờ giấy vừa rơi khỏi vở. Hỏi học sinh nhìn thấy điều gì và muốn nói câu nào. Không yêu cầu học sinh kể tên bạn thật có khó khăn.',
        students: 'Nêu dấu hiệu Nam cần hỗ trợ; đề xuất câu “Bạn có cần mình giúp nhặt giấy không?” hoặc cách diễn đạt lịch sự tương tự.',
        evidence: 'Học sinh nêu được lời hỏi phù hợp, chưa tự ý lấy đồ của bạn; phân biệt điều quan sát được với suy đoán về hoàn cảnh.'
      },
      {
        name: 'Khám phá — Hỏi, giúp vừa sức, nhờ khi cần',
        minutes: 8,
        teacher: 'Làm mẫu hai cách: giật lấy vở để làm hộ và hỏi bạn cần hỗ trợ gì. Cho lớp so sánh, rút ra ba bước: hỏi bạn, giúp việc phù hợp, nhờ giáo viên nếu vượt khả năng. Nêu ví dụ bạn chưa hiểu bài thì gợi mở hoặc nhờ giáo viên, không cho chép đáp án.',
        students: 'Nhận xét cảm giác của người được giúp trong hai cách; nói lại ba bước bằng lời riêng hoặc dùng ba từ khóa trên bảng.',
        evidence: 'Học sinh chỉ được ít nhất một khác biệt giữa giúp bạn và làm hộ; biết có tình huống cần người lớn hỗ trợ.'
      },
      {
        name: 'Luyện tập — Chọn cách và đóng vai',
        minutes: 15,
        teacher: 'Dành 3 phút đọc và chọn tình huống, 7 phút cặp đổi vai, 5 phút chia sẻ góp ý. Dùng ba tình huống trong phiếu; hướng dẫn quan sát lời hỏi, sự đồng ý của bạn và việc giúp phù hợp. Mời vài cặp tự nguyện, không yêu cầu diễn lại sự việc cá nhân.',
        students: 'Một em đóng vai bạn cần giúp, em kia hỏi và đề nghị một việc vừa sức; đổi vai. Với tình huống bạn ngã đau chân, nói cách báo giáo viên, không tự ý kéo hoặc cõng bạn.',
        evidence: 'Mỗi em thực hiện được ít nhất một lượt nói–đáp. Cách giúp không gồm làm hộ bài, tự ý lấy đồ hoặc xử trí việc vượt khả năng; giáo viên sửa lời nói thiếu tôn trọng.'
      },
      {
        name: 'Vận dụng — Chọn một việc có thể thực hiện',
        minutes: 7,
        teacher: 'Cho học sinh ghi, vẽ hoặc nói một việc giúp bạn trong lớp và lời hỏi đi kèm. Hỏi nếu bạn chưa muốn nhận giúp đỡ thì làm gì; chốt tôn trọng bạn, riêng nguy cơ mất an toàn cần báo người lớn. Hẹn quan sát cơ hội thực hiện trong sinh hoạt lớp.',
        students: 'Chọn một việc cụ thể, nêu thời điểm và lời hỏi; chia sẻ với bạn bên cạnh. Tự nhận xét điều mình còn cần luyện khi muốn giúp người khác.',
        evidence: 'Kế hoạch cá nhân có việc vừa sức và câu hỏi tôn trọng bạn. Giáo viên theo dõi hành vi về sau, không kết luận phẩm chất chỉ từ một lần đóng vai.'
      }
    ],
    worksheet: 'PHIẾU TÌNH HUỐNG — GIÚP BẠN BẰNG VIỆC VỪA SỨC\nGiáo viên có thể đọc tình huống; học sinh trả lời hoặc đóng vai theo cặp. Đây đều là tình huống giả định.\n\n1. Nam làm rơi mấy tờ giấy ở cạnh bàn.\nEm sẽ hỏi: .......................................................\nNếu Nam đồng ý, em có thể: .......................................\n\n2. Lan chưa hiểu một bài tập và muốn chép đáp án của em.\nEm chọn cách nào?\nA. Đưa toàn bộ đáp án để bạn chép.\nB. Hỏi bạn vướng ở đâu, gợi ý một bước; nhờ giáo viên khi cả hai còn chưa hiểu.\nEm nói với Lan: .................................................\n\n3. Một bạn bị ngã và nói đau chân.\nEm có thể làm gì ngay? Em cần nhờ ai?\n..................................................................\n\nVIỆC EM MUỐN THỬ TRONG LỚP\nViệc vừa sức: ....................................................\nLời hỏi trước khi giúp: ..........................................\n\nGỢI Ý DÀNH CHO GIÁO VIÊN\n1. Hỏi bạn có cần hỗ trợ, cùng nhặt giấy sạch nếu bạn đồng ý; tôn trọng đồ dùng của bạn.\n2. Chọn B; giúp hiểu cách làm, không làm hộ hoặc cho chép.\n3. Báo ngay giáo viên/người lớn phụ trách, giữ khoảng trống và không tự ý kéo, cõng hay xử trí chấn thương. Chấp nhận lời diễn đạt khác phù hợp tình huống.',
    questions: [
      'Em nhìn thấy dấu hiệu nào cho biết bạn có thể cần giúp đỡ?',
      'Vì sao nên hỏi bạn trước khi giúp hoặc cầm đồ của bạn?',
      'Khi bạn chưa hiểu bài, giúp bạn khác với làm hộ ở điểm nào?',
      'Việc nào em có thể làm, việc nào cần báo giáo viên hoặc người lớn?'
    ],
    adaptations: [
      'Cần hỗ trợ tiếng Việt: dùng khung “Bạn có cần ... không?”, “Mình có thể ...”, “Mình nhờ cô/thầy ...”; cho luyện trong cặp trước khi diễn.',
      'Học sinh ngại đóng vai hoặc khó di chuyển: trả lời bằng lời, tranh hoặc chọn phương án tại chỗ; không bắt buộc diễn bằng vận động.',
      'Thiếu giấy và đạo cụ: giáo viên đọc tình huống, dùng một quyển vở và bút chung; học sinh nhắc lại việc cần làm bằng lời.',
      'Bảo vệ sự riêng tư: dùng nhân vật giả định, không gọi tên học sinh có hoàn cảnh khó khăn và không tổ chức so sánh việc đóng góp đồ dùng hoặc tiền.',
      'Sau bài dạy, ghi lời nói/hành vi cần luyện thêm và cơ hội thực hành trong lớp; điều chỉnh tình huống theo những việc thật sự phù hợp, không gắn nhãn đạo đức cố định cho học sinh.'
    ],
    review: [
      'Đối chiếu nội dung với yêu cầu cần đạt của chủ đề Đạo đức trong chương trình và sách giáo khoa; xác định việc gì có thể quan sát trong một tiết.',
      'Nếu AI tạo tình huống, loại chi tiết gắn nhãn học sinh theo dân tộc, hoàn cảnh hoặc năng lực; dùng nhân vật giả định và lời nói tôn trọng.',
      'Yêu cầu AI: “Rà xem cách giúp có sự đồng ý của bạn, có vừa sức và có làm hộ hay không; chỉ ra tình huống cần giáo viên.” Giáo viên tự kiểm tra từng phương án, không giao việc xử trí chấn thương cho học sinh.',
      'Kiểm tra mọi hoạt động không đòi đóng góp tiền, mua quà hoặc kể thông tin riêng. Thay đạo cụ bằng đồ sẵn có và bảo đảm cả hai em đều được đổi vai.',
      'Dùng minh chứng lời hỏi, cách đề nghị và hành vi thực tế để giữ/sửa gợi ý AI; bổ sung điều chỉnh sau bài dạy và theo dõi tiếp trong sinh hoạt lớp.'
    ]
  },
  {
    id: 'hdtn-3-bao-ve-truong',
    title: 'Cùng giữ trường sạch và an toàn',
    subject: 'Hoạt động trải nghiệm',
    grade: 3,
    duration: 35,
    summary: 'Nhận diện việc vừa sức, lập kế hoạch nhóm và thử một thao tác giữ góc lớp gọn sạch. Không yêu cầu học sinh xử lý rác lạ hoặc ra nơi nguy hiểm.',
    conditions: ['Không máy chiếu', 'Không máy in', 'Học liệu địa phương', 'Có phương án trời mưa'],
    goals: 'Mục tiêu minh họa, cần giáo viên đối chiếu yêu cầu cần đạt của Hoạt động trải nghiệm lớp 3, kế hoạch nhà trường và chủ đề đang triển khai.\n• Học sinh nêu được một số việc phù hợp để giữ lớp, trường sạch và an toàn; phân biệt việc có thể tự làm với việc cần báo người lớn.\n• Cùng nhóm lập được kế hoạch nhỏ có việc làm, người thực hiện, thời gian, đồ dùng và dấu hiệu hoàn thành; thực hành một việc vừa sức dưới hướng dẫn.\n• Có cơ hội phát triển trách nhiệm, hợp tác và năng lực thiết kế, tổ chức hoạt động; tôn trọng điều kiện tham gia khác nhau của các bạn.',
    materials: [
      'Bảng, phấn; giáo viên vẽ sơ đồ đơn giản góc lớp hoặc sân trường đã kiểm tra trước.',
      'Vài tờ giấy sạch mô phỏng đồ dùng đặt sai chỗ, một hộp đựng và chồng sách/vở chung. Không dùng rác thật để làm học liệu.',
      'Vở, bút; tiêu chí kiểm tra viết lên bảng. Không yêu cầu găng tay, túi rác hoặc thiết bị chưa có trong lớp.'
    ],
    activities: [
      {
        name: 'Mở đầu — Góc lớp cần điều gì?',
        minutes: 5,
        teacher: 'Cho quan sát góc bàn với giấy sạch và vài quyển vở đặt chưa gọn; hỏi điều gì có thể gây bất tiện hoặc cản lối. Nêu phạm vi hoạt động trong lớp và mục đích giữ nơi học tập gọn, sạch, an toàn.',
        students: 'Chỉ một điểm cần sắp xếp hoặc giữ gìn; nêu tác động với việc học và đi lại. Không tự ý di chuyển đồ khi chưa được giao nhiệm vụ.',
        evidence: 'Học sinh nêu một vấn đề quan sát được, ví dụ đồ lấn lối đi; tránh chỉ nói chung “trường chưa sạch” mà không có căn cứ.'
      },
      {
        name: 'Khám phá — Việc vừa sức và việc cần báo',
        minutes: 8,
        teacher: 'Đọc bốn tình huống: giấy sạch trên bàn, sách để sai chỗ, mảnh kính cạnh lối đi, vòi nước rò. Hướng dẫn phân biệt việc được phép làm theo hướng dẫn với việc báo giáo viên/người lớn; không chạm mảnh kính hoặc tự sửa vòi.',
        students: 'Chọn cách xử lý và giải thích. Với giấy, sách sạch: hỏi và sắp xếp đúng chỗ theo hướng dẫn. Với kính, nước rò: báo người lớn và tránh khu vực có nguy cơ.',
        evidence: 'Học sinh phân loại được ít nhất một việc vừa sức và một việc cần báo người lớn; không coi mọi rác hay thiết bị đều là nhiệm vụ tự xử lý của học sinh.'
      },
      {
        name: 'Luyện tập — Lập kế hoạch và thử việc nhỏ',
        minutes: 15,
        teacher: 'Dành 5 phút nhóm điền kế hoạch, 2 phút giáo viên kiểm tra phạm vi và phân công, 5 phút thực hành sắp xếp sách/vở chung hoặc giấy sạch tại bàn, 3 phút thu dọn và tự kiểm tra. Chỉ cho làm sau khi thống nhất vị trí, thao tác và tiêu chí.',
        students: 'Nhóm 4 em phân công người sắp xếp, người chuyển giấy sạch vào hộp, người quan sát lối đi và người ghi kết quả; đổi hoặc gộp vai theo khả năng. Thực hiện nhiệm vụ nhỏ tại bàn và kiểm tra theo tiêu chí.',
        evidence: 'Kế hoạch có đủ việc, người, thời gian, đồ dùng, dấu hiệu hoàn thành. Kết quả quan sát: sách xếp gọn đúng nơi, giấy sạch vào hộp, lối đi không bị lấn; không leo, bê vật nặng hoặc chạm rác lạ.'
      },
      {
        name: 'Vận dụng — Rút kinh nghiệm và chọn việc tiếp theo',
        minutes: 7,
        teacher: 'Cho nhóm báo một việc đã xong và một điều cần đổi trong cách phối hợp. Mời từng em chọn một việc duy trì hằng ngày trong phạm vi được phép; thống nhất báo giáo viên khi thấy nguy cơ, không tự mở rộng nhiệm vụ ngoài trường.',
        students: 'Đối chiếu kế hoạch với kết quả, nói rõ phần chưa thực hiện. Chọn hành động như cất vở đúng chỗ, dùng lại giấy sạch hoặc giữ lối đi thông thoáng; nêu khi nào cần nhờ người lớn.',
        evidence: 'Học sinh dùng tiêu chí cụ thể để nhận xét, có đề xuất điều chỉnh khả thi. Giáo viên ghi mức tham gia từng em và chỉ tiếp tục nhiệm vụ sau tiết học khi đã có tổ chức phù hợp.'
      }
    ],
    worksheet: 'PHIẾU KẾ HOẠCH NHỎ — GIỮ GÓC LỚP GỌN, SẠCH, AN TOÀN\nNhóm: ..........  Ngày thực hiện: ..........\nCó thể ghi ngắn vào vở hoặc trình bày miệng theo năm mục.\n\n1. Việc nhóm được giáo viên đồng ý thực hiện: .....................\n2. Ai làm việc gì?\n• Bạn/vai trò 1: ................................................\n• Bạn/vai trò 2: ................................................\n• Bạn/vai trò 3: ................................................\n• Bạn/vai trò 4: ................................................\n3. Thời gian thử thực hiện trong tiết học: 5 phút.\n4. Đồ dùng có sẵn: ...............................................\n5. Dấu hiệu hoàn thành: ..........................................\n\nTỰ KIỂM TRA\n[ ] Việc làm nằm trong phạm vi đã được đồng ý.\n[ ] Đồ dùng được xếp đúng chỗ, không lấn lối đi.\n[ ] Các thành viên đều có việc phù hợp để tham gia.\nĐiều nhóm cần đổi lần sau: .......................................\n\nCHỌN CÁCH XỬ LÝ\nA. Giấy sạch rơi trên bàn: hỏi và cất vào hộp theo hướng dẫn.\nB. Mảnh kính hoặc vật sắc lạ: không chạm, báo ngay giáo viên/người lớn.\nC. Vòi nước rò: báo người phụ trách, không tự sửa.\n\nGỢI Ý DÀNH CHO GIÁO VIÊN\nKhông có một kế hoạch duy nhất. Chấp nhận cách phân công khác nếu vừa sức, có thời gian, đồ dùng và tiêu chí rõ; không giao nhặt rác lạ, leo cao, đến bờ dốc/suối hoặc tự xử lý điện, nước. Tiết mẫu chỉ thực hành với sách, vở và giấy sạch.',
    questions: [
      'Em thấy điều gì ở góc lớp cần thay đổi? Thay đổi ấy giúp việc học hoặc đi lại thế nào?',
      'Việc nào nhóm được phép tự làm theo hướng dẫn? Việc nào cần báo người lớn?',
      'Làm sao biết kế hoạch đã hoàn thành, ngoài việc nói “đã làm xong”?',
      'Nếu một bạn không thể làm thao tác di chuyển, nhóm phân công việc gì để bạn vẫn tham gia?'
    ],
    adaptations: [
      'Mưa, rét hoặc sân không an toàn: tổ chức toàn bộ tại bàn học, dùng sơ đồ lớp và đồ sạch; không bắt buộc ra sân.',
      'Không có đồ dùng vệ sinh: chọn sắp xếp sách, vở hoặc giấy sạch, không triển khai lao động với rác thật hay yêu cầu gia đình mua dụng cụ.',
      'Cần hỗ trợ tiếng Việt: dùng sơ đồ và năm câu hỏi ngắn “Làm gì? Ai làm? Khi nào? Cần gì? Biết xong bằng cách nào?”; cho trả lời miệng rồi một bạn ghi.',
      'Khả năng vận động hoặc nhịp học khác nhau: có vai quan sát, kiểm tra lối đi, đếm hoặc ghi kết quả tại chỗ; không đánh giá mức tham gia chỉ bằng lượng việc di chuyển.',
      'Sau bài dạy, ghi việc mất nhiều thời gian, phân công chưa đều và nguy cơ đã phát hiện; chỉ mở rộng hoạt động ngoài lớp khi có điều kiện và người phụ trách phù hợp.'
    ],
    review: [
      'Đối chiếu yêu cầu cần đạt, loại hình Hoạt động trải nghiệm và thời điểm thực hiện với kế hoạch giáo dục của nhà trường; ví dụ này là một tiết minh họa, không thay kế hoạch cả chủ đề.',
      'Nếu AI đề xuất vệ sinh ngoài sân hoặc phân loại rác, kiểm tra phạm vi, vật liệu và người phụ trách. Bỏ đề xuất xử lý rác lạ, vật sắc, điện/nước hoặc nơi có dốc, suối.',
      'Yêu cầu AI: “Rà kế hoạch theo năm mục việc, người, thời gian, đồ dùng, dấu hiệu hoàn thành; đề xuất sửa bằng đồ hiện có và chỉ ra việc cần người lớn.” Giáo viên đối chiếu với vị trí thật của lớp.',
      'Kiểm tra 5 + 8 + 15 + 7 = 35 phút; 5 phút thực hành nằm trong 15 phút luyện tập, không cộng thêm thành tiết dài hơn. Không thêm nhiệm vụ ngoài giờ khi chưa được tổ chức.',
      'Từ kết quả thực hành, giáo viên ghi điều chỉnh sau bài dạy và chọn giữ/sửa/bỏ từng gợi ý AI; không dùng lời AI xác nhận “an toàn” thay cho việc tự kiểm tra điều kiện triển khai.'
    ]
  }
];
