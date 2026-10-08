// KVKK aydınlatma metni ve çerez politikası (TR / EN)
// Not: Şirket unvanı ve MERSİS/VERBİS bilgileri hukuki kontrol sırasında eklenmelidir.
const CO = 'Sofilx Filtre', ADR = 'Esatpaşa Mah. Bingöl Sok. No:1A, Ataşehir / İstanbul', MAIL = 'info@sofilx.com';
export const pages = {
  tr: {
    kvkk: {
      title: 'KVKK Aydınlatma Metni',
      lead: '6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamında kişisel verilerinizin nasıl işlendiğini açıklıyoruz.',
      html: `<h2>1. Veri sorumlusu</h2><p>Kişisel verileriniz, veri sorumlusu sıfatıyla ${CO} (“Sofilx”), ${ADR} adresinde mukim şirketimiz tarafından aşağıda açıklanan kapsamda işlenmektedir.</p>
<h2>2. İşlenen kişisel veriler</h2><ul><li><b>Kimlik ve iletişim:</b> ad soyad, firma adı, telefon numarası, e-posta adresi, şehir.</li><li><b>Talep bilgileri:</b> teklif listesindeki ürünler, adetler, notlar ve teslimat tercihi.</li><li><b>İşlem güvenliği ve kullanım:</b> IP adresi, tarayıcı bilgileri ve çerez verileri (yalnızca onay verdiğiniz ölçüde).</li></ul>
<h2>3. İşleme amaçları</h2><ul><li>Teklif taleplerinizi almak, değerlendirmek ve size teklif iletmek,</li><li>Sipariş, teslimat ve satış sonrası süreçleri yürütmek,</li><li>Talep ve şikâyetlerinizi yanıtlamak,</li><li>Hukuki yükümlülüklerimizi yerine getirmek,</li><li>Onay vermeniz hâlinde site kullanımını ölçmek ve hizmetlerimizi geliştirmek.</li></ul>
<h2>4. Hukuki sebepler</h2><p>Kişisel verileriniz KVKK m.5/2 uyarınca; bir sözleşmenin kurulması veya ifasıyla doğrudan ilgili olması (c), hukuki yükümlülüğümüzü yerine getirebilmemiz (ç) ve temel hak ve özgürlüklerinize zarar vermemek kaydıyla meşru menfaatimiz (f) hukuki sebeplerine; analitik çerezler bakımından ise açık rızanıza (m.5/1) dayanılarak işlenir.</p>
<h2>5. Toplama yöntemi</h2><p>Verileriniz, internet sitemizdeki teklif formu, WhatsApp, telefon ve e-posta kanalları ile çerezler aracılığıyla elektronik ortamda toplanır.</p>
<h2>6. Aktarım</h2><p>Kişisel verileriniz; teklif formunun iletilmesi için kullanılan e-posta/form altyapısı hizmet sağlayıcılarına, barındırma (hosting) hizmeti sağlayıcısına, kargo ve lojistik firmalarına, yasal zorunluluk hâlinde yetkili kamu kurum ve kuruluşlarına KVKK m.8 ve m.9’daki şartlara uygun olarak aktarılabilir. Kullanılan bazı hizmet sağlayıcıların sunucuları yurt dışında bulunabilir.</p>
<h2>7. Saklama süresi</h2><p>Verileriniz, işleme amacının gerektirdiği süre ve ilgili mevzuatta öngörülen zamanaşımı süreleri boyunca saklanır; sürenin sonunda silinir, yok edilir veya anonim hâle getirilir.</p>
<h2>8. Haklarınız</h2><p>KVKK m.11 uyarınca; verilerinizin işlenip işlenmediğini öğrenme, işlenmişse bilgi talep etme, işlenme amacını ve amacına uygun kullanılıp kullanılmadığını öğrenme, aktarıldığı üçüncü kişileri bilme, eksik veya yanlış işlenmişse düzeltilmesini, şartları oluştuğunda silinmesini veya yok edilmesini isteme, bu işlemlerin aktarılan üçüncü kişilere bildirilmesini isteme, otomatik sistemlerle analiz sonucu aleyhinize bir sonuca itiraz etme ve kanuna aykırı işleme nedeniyle zarara uğramanız hâlinde zararın giderilmesini talep etme haklarına sahipsiniz.</p>
<h2>9. Başvuru</h2><p>Haklarınıza ilişkin taleplerinizi <a href="mailto:${MAIL}">${MAIL}</a> adresine e-posta ile veya ${ADR} adresine yazılı olarak iletebilirsiniz. Başvurularınız en geç 30 gün içinde ücretsiz olarak sonuçlandırılır.</p>
<p class="disclaimer">Son güncelleme: ${new Date().toLocaleDateString('tr-TR')}</p>`
    },
    cookies: {
      title: 'Çerez Politikası',
      lead: 'Sitemizde hangi çerezleri, hangi amaçla kullandığımızı ve tercihlerinizi nasıl yönetebileceğinizi açıklıyoruz.',
      html: `<h2>Çerez nedir?</h2><p>Çerezler, ziyaret ettiğiniz internet siteleri tarafından tarayıcınıza kaydedilen küçük metin dosyalarıdır. Benzer amaçla tarayıcının yerel depolama alanı (localStorage) da kullanılabilir.</p>
<h2>Kullandığımız çerezler</h2><table><thead><tr><th>Tür</th><th>Amaç</th><th>Süre</th><th>Onay</th></tr></thead><tbody>
<tr><td>Zorunlu (yerel depolama)</td><td>Teklif listenizin ve çerez tercihinizin tarayıcınızda saklanması</td><td>Siz silene kadar</td><td>Gerekmez</td></tr>
<tr><td>Analitik (Google Tag Manager / Google Analytics)</td><td>Ziyaret sayısı, kullanılan sayfalar ve trafik kaynaklarının ölçülmesi</td><td>En fazla 2 yıl</td><td>Açık rızanız ile</td></tr></tbody></table>
<h2>Tercihlerinizi yönetme</h2><p>Siteye ilk girişinizde çıkan bant üzerinden analitik çerezleri kabul edebilir ya da yalnızca zorunlu çerezlerle devam edebilirsiniz. Tercihinizi istediğiniz zaman sayfanın altındaki <b>Çerez ayarları</b> bağlantısından değiştirebilirsiniz. Ayrıca tarayıcı ayarlarınızdan çerezleri silebilir veya engelleyebilirsiniz.</p>
<h2>İletişim</h2><p>Sorularınız için <a href="mailto:${MAIL}">${MAIL}</a> adresine yazabilirsiniz. Kişisel verilerinizin işlenmesine ilişkin ayrıntılar için <a href="/kvkk">KVKK Aydınlatma Metni</a>’ni inceleyebilirsiniz.</p>`
    }
  },
  en: {
    kvkk: {
      title: 'Privacy Notice',
      lead: 'How we process your personal data under the Turkish Personal Data Protection Law No. 6698 (KVKK).',
      html: `<h2>1. Data controller</h2><p>Your personal data is processed by ${CO} (“Sofilx”), ${ADR}, as data controller, within the scope described below.</p>
<h2>2. Data we process</h2><ul><li><b>Identity and contact:</b> full name, company, phone number, e-mail address, city.</li><li><b>Request details:</b> items in your quote list, quantities, notes and delivery preference.</li><li><b>Security and usage:</b> IP address, browser information and cookie data (only to the extent you consent).</li></ul>
<h2>3. Purposes</h2><ul><li>To receive and assess your quote requests and send you quotes,</li><li>To handle orders, delivery and after-sales processes,</li><li>To answer your requests and complaints,</li><li>To meet our legal obligations,</li><li>With your consent, to measure site usage and improve our services.</li></ul>
<h2>4. Legal grounds</h2><p>Data is processed on the grounds of performance of a contract, compliance with legal obligations and our legitimate interests (KVKK art. 5/2), and for analytics cookies on the basis of your explicit consent (art. 5/1).</p>
<h2>5. Transfers</h2><p>Your data may be shared with e-mail/form service providers used to deliver the quote form, our hosting provider, shipping companies and, where legally required, competent authorities, in line with KVKK arts. 8 and 9. Some providers may store data outside Turkey.</p>
<h2>6. Retention</h2><p>Data is kept for as long as the purpose requires and the statutory limitation periods; afterwards it is deleted, destroyed or anonymised.</p>
<h2>7. Your rights</h2><p>Under KVKK art. 11 you may ask whether your data is processed, request information, learn the purpose of processing and recipients, request correction or deletion, object to automated decisions and claim compensation for unlawful processing.</p>
<h2>8. Contact</h2><p>Send your requests to <a href="mailto:${MAIL}">${MAIL}</a> or in writing to ${ADR}. Requests are answered free of charge within 30 days.</p>`
    },
    cookies: {
      title: 'Cookie Policy',
      lead: 'Which cookies we use on this site, why, and how you can manage your preferences.',
      html: `<h2>What are cookies?</h2><p>Cookies are small text files stored in your browser by websites you visit. Browser local storage may be used for similar purposes.</p>
<h2>Cookies we use</h2><table><thead><tr><th>Type</th><th>Purpose</th><th>Duration</th><th>Consent</th></tr></thead><tbody>
<tr><td>Strictly necessary (local storage)</td><td>Keeping your quote list and cookie preference in your browser</td><td>Until you delete them</td><td>Not required</td></tr>
<tr><td>Analytics (Google Tag Manager / Google Analytics)</td><td>Measuring visits, pages viewed and traffic sources</td><td>Up to 2 years</td><td>Only with your consent</td></tr></tbody></table>
<h2>Managing your preferences</h2><p>Accept analytics cookies or continue with necessary cookies only using the banner shown on your first visit. You can change your choice any time via <b>Cookie settings</b> at the bottom of each page, or delete cookies in your browser settings.</p>
<h2>Contact</h2><p>Questions: <a href="mailto:${MAIL}">${MAIL}</a>. See also our <a href="/en/privacy">Privacy Notice</a>.</p>`
    }
  }
};
