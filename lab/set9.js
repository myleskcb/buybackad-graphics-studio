
const CARDS = [{"id":"iso-spectrum-1","n":"Spectrum Wall 1","c":"Spectrum","l":"iso","t":"showcase","g":"#0B0B0D","p":"ref-spectrum","sw":["#0B0B0D","#F4F6F8","#FF375F","#FFD60A"]},{"id":"iso-spectrum-2","n":"Spectrum Wall 2","c":"Spectrum","l":"iso","t":"showcase","g":"#0B0B0D","p":"ref-spectrum","sw":["#0B0B0D","#F4F6F8","#FF9F0A","#30D158"]},{"id":"iso-spectrum-3","n":"Spectrum Wall 3","c":"Spectrum","l":"iso","t":"showcase","g":"#0B0B0D","p":"ref-spectrum","sw":["#0B0B0D","#F4F6F8","#FFD60A","#40C8E0"]},{"id":"iso-spectrum-4","n":"Spectrum Wall 4","c":"Spectrum","l":"iso","t":"showcase","g":"#0B0B0D","p":"ref-spectrum","sw":["#0B0B0D","#F4F6F8","#30D158","#0A84FF"]},{"id":"iso-spectrum-5","n":"Spectrum Wall 5","c":"Spectrum","l":"iso","t":"showcase","g":"#0B0B0D","p":"ref-spectrum","sw":["#0B0B0D","#F4F6F8","#40C8E0","#BF5AF2"]},{"id":"family-spectrum-1","n":"Spectrum Family 1","c":"Spectrum","l":"family","t":"showcase","g":"#0B0B0D","p":"ref-spectrum","sw":["#0B0B0D","#F4F6F8","#FF375F","#FFD60A"]},{"id":"family-spectrum-2","n":"Spectrum Family 2","c":"Spectrum","l":"family","t":"showcase","g":"#0B0B0D","p":"ref-spectrum","sw":["#0B0B0D","#F4F6F8","#FF9F0A","#30D158"]},{"id":"family-spectrum-3","n":"Spectrum Family 3","c":"Spectrum","l":"family","t":"showcase","g":"#0B0B0D","p":"ref-spectrum","sw":["#0B0B0D","#F4F6F8","#FFD60A","#40C8E0"]},{"id":"family-spectrum-4","n":"Spectrum Family 4","c":"Spectrum","l":"family","t":"showcase","g":"#0B0B0D","p":"ref-spectrum","sw":["#0B0B0D","#F4F6F8","#30D158","#0A84FF"]},{"id":"family-spectrum-5","n":"Spectrum Family 5","c":"Spectrum","l":"family","t":"showcase","g":"#0B0B0D","p":"ref-spectrum","sw":["#0B0B0D","#F4F6F8","#40C8E0","#BF5AF2"]},{"id":"wall-spectrum-1","n":"Spectrum Assortment 1","c":"Spectrum","l":"wall","t":"showcase","g":"#0B0B0D","p":"ref-spectrum","sw":["#0B0B0D","#F4F6F8","#FF375F","#FFD60A"]},{"id":"wall-spectrum-2","n":"Spectrum Assortment 2","c":"Spectrum","l":"wall","t":"showcase","g":"#0B0B0D","p":"ref-spectrum","sw":["#0B0B0D","#F4F6F8","#FF9F0A","#30D158"]},{"id":"wall-spectrum-3","n":"Spectrum Assortment 3","c":"Spectrum","l":"wall","t":"showcase","g":"#0B0B0D","p":"ref-spectrum","sw":["#0B0B0D","#F4F6F8","#FFD60A","#40C8E0"]},{"id":"wall-spectrum-4","n":"Spectrum Assortment 4","c":"Spectrum","l":"wall","t":"showcase","g":"#0B0B0D","p":"ref-spectrum","sw":["#0B0B0D","#F4F6F8","#30D158","#0A84FF"]},{"id":"wall-spectrum-5","n":"Spectrum Assortment 5","c":"Spectrum","l":"wall","t":"showcase","g":"#0B0B0D","p":"ref-spectrum","sw":["#0B0B0D","#F4F6F8","#40C8E0","#BF5AF2"]},{"id":"trio-spectrum-1","n":"Spectrum Trio 1","c":"Spectrum","l":"trio","t":"showcase","g":"#0B0B0D","p":"ref-spectrum","sw":["#0B0B0D","#F4F6F8","#FF375F","#FFD60A"]},{"id":"trio-spectrum-2","n":"Spectrum Trio 2","c":"Spectrum","l":"trio","t":"showcase","g":"#0B0B0D","p":"ref-spectrum","sw":["#0B0B0D","#F4F6F8","#FF9F0A","#30D158"]},{"id":"trio-spectrum-3","n":"Spectrum Trio 3","c":"Spectrum","l":"trio","t":"showcase","g":"#0B0B0D","p":"ref-spectrum","sw":["#0B0B0D","#F4F6F8","#FFD60A","#40C8E0"]},{"id":"trio-spectrum-4","n":"Spectrum Trio 4","c":"Spectrum","l":"trio","t":"showcase","g":"#0B0B0D","p":"ref-spectrum","sw":["#0B0B0D","#F4F6F8","#30D158","#0A84FF"]},{"id":"trio-spectrum-5","n":"Spectrum Trio 5","c":"Spectrum","l":"trio","t":"showcase","g":"#0B0B0D","p":"ref-spectrum","sw":["#0B0B0D","#F4F6F8","#40C8E0","#BF5AF2"]},{"id":"iso-blueprint-1","n":"Blueprint Wall 1","c":"Blueprint","l":"iso","t":"showcase","g":"#071528","p":"ref-blueprint","sw":["#071528","#DCEBFF","#0A84FF","#5AC8FA"]},{"id":"iso-blueprint-2","n":"Blueprint Wall 2","c":"Blueprint","l":"iso","t":"showcase","g":"#071528","p":"ref-blueprint","sw":["#071528","#DCEBFF","#40C8E0","#2E7BE0"]},{"id":"iso-blueprint-3","n":"Blueprint Wall 3","c":"Blueprint","l":"iso","t":"showcase","g":"#071528","p":"ref-blueprint","sw":["#071528","#DCEBFF","#5AC8FA","#8FD3FF"]},{"id":"iso-blueprint-4","n":"Blueprint Wall 4","c":"Blueprint","l":"iso","t":"showcase","g":"#071528","p":"ref-blueprint","sw":["#071528","#DCEBFF","#2E7BE0","#1B4FA0"]},{"id":"iso-blueprint-5","n":"Blueprint Wall 5","c":"Blueprint","l":"iso","t":"showcase","g":"#071528","p":"ref-blueprint","sw":["#071528","#DCEBFF","#8FD3FF","#0A84FF"]},{"id":"family-blueprint-1","n":"Blueprint Family 1","c":"Blueprint","l":"family","t":"showcase","g":"#071528","p":"ref-blueprint","sw":["#071528","#DCEBFF","#0A84FF","#5AC8FA"]},{"id":"family-blueprint-2","n":"Blueprint Family 2","c":"Blueprint","l":"family","t":"showcase","g":"#071528","p":"ref-blueprint","sw":["#071528","#DCEBFF","#40C8E0","#2E7BE0"]},{"id":"family-blueprint-3","n":"Blueprint Family 3","c":"Blueprint","l":"family","t":"showcase","g":"#071528","p":"ref-blueprint","sw":["#071528","#DCEBFF","#5AC8FA","#8FD3FF"]},{"id":"family-blueprint-4","n":"Blueprint Family 4","c":"Blueprint","l":"family","t":"showcase","g":"#071528","p":"ref-blueprint","sw":["#071528","#DCEBFF","#2E7BE0","#1B4FA0"]},{"id":"family-blueprint-5","n":"Blueprint Family 5","c":"Blueprint","l":"family","t":"showcase","g":"#071528","p":"ref-blueprint","sw":["#071528","#DCEBFF","#8FD3FF","#0A84FF"]},{"id":"wall-blueprint-1","n":"Blueprint Assortment 1","c":"Blueprint","l":"wall","t":"showcase","g":"#071528","p":"ref-blueprint","sw":["#071528","#DCEBFF","#0A84FF","#5AC8FA"]},{"id":"wall-blueprint-2","n":"Blueprint Assortment 2","c":"Blueprint","l":"wall","t":"showcase","g":"#071528","p":"ref-blueprint","sw":["#071528","#DCEBFF","#40C8E0","#2E7BE0"]},{"id":"wall-blueprint-3","n":"Blueprint Assortment 3","c":"Blueprint","l":"wall","t":"showcase","g":"#071528","p":"ref-blueprint","sw":["#071528","#DCEBFF","#5AC8FA","#8FD3FF"]},{"id":"wall-blueprint-4","n":"Blueprint Assortment 4","c":"Blueprint","l":"wall","t":"showcase","g":"#071528","p":"ref-blueprint","sw":["#071528","#DCEBFF","#2E7BE0","#1B4FA0"]},{"id":"wall-blueprint-5","n":"Blueprint Assortment 5","c":"Blueprint","l":"wall","t":"showcase","g":"#071528","p":"ref-blueprint","sw":["#071528","#DCEBFF","#8FD3FF","#0A84FF"]},{"id":"trio-blueprint-1","n":"Blueprint Trio 1","c":"Blueprint","l":"trio","t":"showcase","g":"#071528","p":"ref-blueprint","sw":["#071528","#DCEBFF","#0A84FF","#5AC8FA"]},{"id":"trio-blueprint-2","n":"Blueprint Trio 2","c":"Blueprint","l":"trio","t":"showcase","g":"#071528","p":"ref-blueprint","sw":["#071528","#DCEBFF","#40C8E0","#2E7BE0"]},{"id":"trio-blueprint-3","n":"Blueprint Trio 3","c":"Blueprint","l":"trio","t":"showcase","g":"#071528","p":"ref-blueprint","sw":["#071528","#DCEBFF","#5AC8FA","#8FD3FF"]},{"id":"trio-blueprint-4","n":"Blueprint Trio 4","c":"Blueprint","l":"trio","t":"showcase","g":"#071528","p":"ref-blueprint","sw":["#071528","#DCEBFF","#2E7BE0","#1B4FA0"]},{"id":"trio-blueprint-5","n":"Blueprint Trio 5","c":"Blueprint","l":"trio","t":"showcase","g":"#071528","p":"ref-blueprint","sw":["#071528","#DCEBFF","#8FD3FF","#0A84FF"]},{"id":"iso-mint-1","n":"Mint Room Wall 1","c":"Mint Room","l":"iso","t":"showcase","g":"#A8DCD5","p":"ref-mint","sw":["#A8DCD5","#123833","#2FA37C","#F4C83C"]},{"id":"iso-mint-2","n":"Mint Room Wall 2","c":"Mint Room","l":"iso","t":"showcase","g":"#A8DCD5","p":"ref-mint","sw":["#A8DCD5","#123833","#F2A03D","#E0524A"]},{"id":"iso-mint-3","n":"Mint Room Wall 3","c":"Mint Room","l":"iso","t":"showcase","g":"#A8DCD5","p":"ref-mint","sw":["#A8DCD5","#123833","#F4C83C","#5B4BC4"]},{"id":"iso-mint-4","n":"Mint Room Wall 4","c":"Mint Room","l":"iso","t":"showcase","g":"#A8DCD5","p":"ref-mint","sw":["#A8DCD5","#123833","#E0524A","#2E7BE0"]},{"id":"iso-mint-5","n":"Mint Room Wall 5","c":"Mint Room","l":"iso","t":"showcase","g":"#A8DCD5","p":"ref-mint","sw":["#A8DCD5","#123833","#5B4BC4","#2FA37C"]},{"id":"family-mint-1","n":"Mint Room Family 1","c":"Mint Room","l":"family","t":"showcase","g":"#A8DCD5","p":"ref-mint","sw":["#A8DCD5","#123833","#2FA37C","#F4C83C"]},{"id":"family-mint-2","n":"Mint Room Family 2","c":"Mint Room","l":"family","t":"showcase","g":"#A8DCD5","p":"ref-mint","sw":["#A8DCD5","#123833","#F2A03D","#E0524A"]},{"id":"family-mint-3","n":"Mint Room Family 3","c":"Mint Room","l":"family","t":"showcase","g":"#A8DCD5","p":"ref-mint","sw":["#A8DCD5","#123833","#F4C83C","#5B4BC4"]},{"id":"family-mint-4","n":"Mint Room Family 4","c":"Mint Room","l":"family","t":"showcase","g":"#A8DCD5","p":"ref-mint","sw":["#A8DCD5","#123833","#E0524A","#2E7BE0"]},{"id":"family-mint-5","n":"Mint Room Family 5","c":"Mint Room","l":"family","t":"showcase","g":"#A8DCD5","p":"ref-mint","sw":["#A8DCD5","#123833","#5B4BC4","#2FA37C"]},{"id":"wall-mint-1","n":"Mint Room Assortment 1","c":"Mint Room","l":"wall","t":"showcase","g":"#A8DCD5","p":"ref-mint","sw":["#A8DCD5","#123833","#2FA37C","#F4C83C"]},{"id":"wall-mint-2","n":"Mint Room Assortment 2","c":"Mint Room","l":"wall","t":"showcase","g":"#A8DCD5","p":"ref-mint","sw":["#A8DCD5","#123833","#F2A03D","#E0524A"]},{"id":"wall-mint-3","n":"Mint Room Assortment 3","c":"Mint Room","l":"wall","t":"showcase","g":"#A8DCD5","p":"ref-mint","sw":["#A8DCD5","#123833","#F4C83C","#5B4BC4"]},{"id":"wall-mint-4","n":"Mint Room Assortment 4","c":"Mint Room","l":"wall","t":"showcase","g":"#A8DCD5","p":"ref-mint","sw":["#A8DCD5","#123833","#E0524A","#2E7BE0"]},{"id":"wall-mint-5","n":"Mint Room Assortment 5","c":"Mint Room","l":"wall","t":"showcase","g":"#A8DCD5","p":"ref-mint","sw":["#A8DCD5","#123833","#5B4BC4","#2FA37C"]},{"id":"trio-mint-1","n":"Mint Room Trio 1","c":"Mint Room","l":"trio","t":"showcase","g":"#A8DCD5","p":"ref-mint","sw":["#A8DCD5","#123833","#2FA37C","#F4C83C"]},{"id":"trio-mint-2","n":"Mint Room Trio 2","c":"Mint Room","l":"trio","t":"showcase","g":"#A8DCD5","p":"ref-mint","sw":["#A8DCD5","#123833","#F2A03D","#E0524A"]},{"id":"trio-mint-3","n":"Mint Room Trio 3","c":"Mint Room","l":"trio","t":"showcase","g":"#A8DCD5","p":"ref-mint","sw":["#A8DCD5","#123833","#F4C83C","#5B4BC4"]},{"id":"trio-mint-4","n":"Mint Room Trio 4","c":"Mint Room","l":"trio","t":"showcase","g":"#A8DCD5","p":"ref-mint","sw":["#A8DCD5","#123833","#E0524A","#2E7BE0"]},{"id":"trio-mint-5","n":"Mint Room Trio 5","c":"Mint Room","l":"trio","t":"showcase","g":"#A8DCD5","p":"ref-mint","sw":["#A8DCD5","#123833","#5B4BC4","#2FA37C"]},{"id":"iso-sky-1","n":"Sky Arcs Wall 1","c":"Sky Arcs","l":"iso","t":"showcase","g":"#BCDCEA","p":"ref-sky","sw":["#BCDCEA","#10303D","#39B7E8","#E8455E"]},{"id":"iso-sky-2","n":"Sky Arcs Wall 2","c":"Sky Arcs","l":"iso","t":"showcase","g":"#BCDCEA","p":"ref-sky","sw":["#BCDCEA","#10303D","#B84AC8","#F2842C"]},{"id":"iso-sky-3","n":"Sky Arcs Wall 3","c":"Sky Arcs","l":"iso","t":"showcase","g":"#BCDCEA","p":"ref-sky","sw":["#BCDCEA","#10303D","#E8455E","#F4C83C"]},{"id":"iso-sky-4","n":"Sky Arcs Wall 4","c":"Sky Arcs","l":"iso","t":"showcase","g":"#BCDCEA","p":"ref-sky","sw":["#BCDCEA","#10303D","#F2842C","#7FCF4A"]},{"id":"iso-sky-5","n":"Sky Arcs Wall 5","c":"Sky Arcs","l":"iso","t":"showcase","g":"#BCDCEA","p":"ref-sky","sw":["#BCDCEA","#10303D","#F4C83C","#39B7E8"]},{"id":"family-sky-1","n":"Sky Arcs Family 1","c":"Sky Arcs","l":"family","t":"showcase","g":"#BCDCEA","p":"ref-sky","sw":["#BCDCEA","#10303D","#39B7E8","#E8455E"]},{"id":"family-sky-2","n":"Sky Arcs Family 2","c":"Sky Arcs","l":"family","t":"showcase","g":"#BCDCEA","p":"ref-sky","sw":["#BCDCEA","#10303D","#B84AC8","#F2842C"]},{"id":"family-sky-3","n":"Sky Arcs Family 3","c":"Sky Arcs","l":"family","t":"showcase","g":"#BCDCEA","p":"ref-sky","sw":["#BCDCEA","#10303D","#E8455E","#F4C83C"]},{"id":"family-sky-4","n":"Sky Arcs Family 4","c":"Sky Arcs","l":"family","t":"showcase","g":"#BCDCEA","p":"ref-sky","sw":["#BCDCEA","#10303D","#F2842C","#7FCF4A"]},{"id":"family-sky-5","n":"Sky Arcs Family 5","c":"Sky Arcs","l":"family","t":"showcase","g":"#BCDCEA","p":"ref-sky","sw":["#BCDCEA","#10303D","#F4C83C","#39B7E8"]},{"id":"wall-sky-1","n":"Sky Arcs Assortment 1","c":"Sky Arcs","l":"wall","t":"showcase","g":"#BCDCEA","p":"ref-sky","sw":["#BCDCEA","#10303D","#39B7E8","#E8455E"]},{"id":"wall-sky-2","n":"Sky Arcs Assortment 2","c":"Sky Arcs","l":"wall","t":"showcase","g":"#BCDCEA","p":"ref-sky","sw":["#BCDCEA","#10303D","#B84AC8","#F2842C"]},{"id":"wall-sky-3","n":"Sky Arcs Assortment 3","c":"Sky Arcs","l":"wall","t":"showcase","g":"#BCDCEA","p":"ref-sky","sw":["#BCDCEA","#10303D","#E8455E","#F4C83C"]},{"id":"wall-sky-4","n":"Sky Arcs Assortment 4","c":"Sky Arcs","l":"wall","t":"showcase","g":"#BCDCEA","p":"ref-sky","sw":["#BCDCEA","#10303D","#F2842C","#7FCF4A"]},{"id":"wall-sky-5","n":"Sky Arcs Assortment 5","c":"Sky Arcs","l":"wall","t":"showcase","g":"#BCDCEA","p":"ref-sky","sw":["#BCDCEA","#10303D","#F4C83C","#39B7E8"]},{"id":"trio-sky-1","n":"Sky Arcs Trio 1","c":"Sky Arcs","l":"trio","t":"showcase","g":"#BCDCEA","p":"ref-sky","sw":["#BCDCEA","#10303D","#39B7E8","#E8455E"]},{"id":"trio-sky-2","n":"Sky Arcs Trio 2","c":"Sky Arcs","l":"trio","t":"showcase","g":"#BCDCEA","p":"ref-sky","sw":["#BCDCEA","#10303D","#B84AC8","#F2842C"]},{"id":"trio-sky-3","n":"Sky Arcs Trio 3","c":"Sky Arcs","l":"trio","t":"showcase","g":"#BCDCEA","p":"ref-sky","sw":["#BCDCEA","#10303D","#E8455E","#F4C83C"]},{"id":"trio-sky-4","n":"Sky Arcs Trio 4","c":"Sky Arcs","l":"trio","t":"showcase","g":"#BCDCEA","p":"ref-sky","sw":["#BCDCEA","#10303D","#F2842C","#7FCF4A"]},{"id":"trio-sky-5","n":"Sky Arcs Trio 5","c":"Sky Arcs","l":"trio","t":"showcase","g":"#BCDCEA","p":"ref-sky","sw":["#BCDCEA","#10303D","#F4C83C","#39B7E8"]},{"id":"iso-poly-1","n":"Poly Grey Wall 1","c":"Poly Grey","l":"iso","t":"showcase","g":"#E8E8EA","p":"ref-poly","sw":["#E8E8EA","#1A1A1E","#FF2D92","#7B3FE4"]},{"id":"iso-poly-2","n":"Poly Grey Wall 2","c":"Poly Grey","l":"iso","t":"showcase","g":"#E8E8EA","p":"ref-poly","sw":["#E8E8EA","#1A1A1E","#E01B2E","#B08CF5"]},{"id":"iso-poly-3","n":"Poly Grey Wall 3","c":"Poly Grey","l":"iso","t":"showcase","g":"#E8E8EA","p":"ref-poly","sw":["#E8E8EA","#1A1A1E","#7B3FE4","#39B7E8"]},{"id":"iso-poly-4","n":"Poly Grey Wall 4","c":"Poly Grey","l":"iso","t":"showcase","g":"#E8E8EA","p":"ref-poly","sw":["#E8E8EA","#1A1A1E","#B08CF5","#2FBF4A"]},{"id":"iso-poly-5","n":"Poly Grey Wall 5","c":"Poly Grey","l":"iso","t":"showcase","g":"#E8E8EA","p":"ref-poly","sw":["#E8E8EA","#1A1A1E","#39B7E8","#A8E85C"]},{"id":"family-poly-1","n":"Poly Grey Family 1","c":"Poly Grey","l":"family","t":"showcase","g":"#E8E8EA","p":"ref-poly","sw":["#E8E8EA","#1A1A1E","#FF2D92","#7B3FE4"]},{"id":"family-poly-2","n":"Poly Grey Family 2","c":"Poly Grey","l":"family","t":"showcase","g":"#E8E8EA","p":"ref-poly","sw":["#E8E8EA","#1A1A1E","#E01B2E","#B08CF5"]},{"id":"family-poly-3","n":"Poly Grey Family 3","c":"Poly Grey","l":"family","t":"showcase","g":"#E8E8EA","p":"ref-poly","sw":["#E8E8EA","#1A1A1E","#7B3FE4","#39B7E8"]},{"id":"family-poly-4","n":"Poly Grey Family 4","c":"Poly Grey","l":"family","t":"showcase","g":"#E8E8EA","p":"ref-poly","sw":["#E8E8EA","#1A1A1E","#B08CF5","#2FBF4A"]},{"id":"family-poly-5","n":"Poly Grey Family 5","c":"Poly Grey","l":"family","t":"showcase","g":"#E8E8EA","p":"ref-poly","sw":["#E8E8EA","#1A1A1E","#39B7E8","#A8E85C"]},{"id":"wall-poly-1","n":"Poly Grey Assortment 1","c":"Poly Grey","l":"wall","t":"showcase","g":"#E8E8EA","p":"ref-poly","sw":["#E8E8EA","#1A1A1E","#FF2D92","#7B3FE4"]},{"id":"wall-poly-2","n":"Poly Grey Assortment 2","c":"Poly Grey","l":"wall","t":"showcase","g":"#E8E8EA","p":"ref-poly","sw":["#E8E8EA","#1A1A1E","#E01B2E","#B08CF5"]},{"id":"wall-poly-3","n":"Poly Grey Assortment 3","c":"Poly Grey","l":"wall","t":"showcase","g":"#E8E8EA","p":"ref-poly","sw":["#E8E8EA","#1A1A1E","#7B3FE4","#39B7E8"]},{"id":"wall-poly-4","n":"Poly Grey Assortment 4","c":"Poly Grey","l":"wall","t":"showcase","g":"#E8E8EA","p":"ref-poly","sw":["#E8E8EA","#1A1A1E","#B08CF5","#2FBF4A"]},{"id":"wall-poly-5","n":"Poly Grey Assortment 5","c":"Poly Grey","l":"wall","t":"showcase","g":"#E8E8EA","p":"ref-poly","sw":["#E8E8EA","#1A1A1E","#39B7E8","#A8E85C"]},{"id":"trio-poly-1","n":"Poly Grey Trio 1","c":"Poly Grey","l":"trio","t":"showcase","g":"#E8E8EA","p":"ref-poly","sw":["#E8E8EA","#1A1A1E","#FF2D92","#7B3FE4"]},{"id":"trio-poly-2","n":"Poly Grey Trio 2","c":"Poly Grey","l":"trio","t":"showcase","g":"#E8E8EA","p":"ref-poly","sw":["#E8E8EA","#1A1A1E","#E01B2E","#B08CF5"]},{"id":"trio-poly-3","n":"Poly Grey Trio 3","c":"Poly Grey","l":"trio","t":"showcase","g":"#E8E8EA","p":"ref-poly","sw":["#E8E8EA","#1A1A1E","#7B3FE4","#39B7E8"]},{"id":"trio-poly-4","n":"Poly Grey Trio 4","c":"Poly Grey","l":"trio","t":"showcase","g":"#E8E8EA","p":"ref-poly","sw":["#E8E8EA","#1A1A1E","#B08CF5","#2FBF4A"]},{"id":"trio-poly-5","n":"Poly Grey Trio 5","c":"Poly Grey","l":"trio","t":"showcase","g":"#E8E8EA","p":"ref-poly","sw":["#E8E8EA","#1A1A1E","#39B7E8","#A8E85C"]},{"id":"bonus-stack-1","n":"Stack · Spectrum 1","c":"Spectrum","l":"stack","t":"showcase","g":"#0B0B0D","p":"ref-spectrum","sw":["#0B0B0D","#F4F6F8","#FF375F","#FFD60A"]},{"id":"bonus-stack-2","n":"Stack · Sky Arcs 2","c":"Sky Arcs","l":"stack","t":"showcase","g":"#BCDCEA","p":"ref-sky","sw":["#BCDCEA","#10303D","#B84AC8","#F2842C"]},{"id":"bonus-stack-3","n":"Stack · Mint Room 3","c":"Mint Room","l":"stack","t":"showcase","g":"#A8DCD5","p":"ref-mint","sw":["#A8DCD5","#123833","#F4C83C","#5B4BC4"]},{"id":"bonus-stack-4","n":"Stack · Poly Grey 4","c":"Poly Grey","l":"stack","t":"showcase","g":"#E8E8EA","p":"ref-poly","sw":["#E8E8EA","#1A1A1E","#B08CF5","#2FBF4A"]},{"id":"bonus-fan-1","n":"Fan · Spectrum 1","c":"Spectrum","l":"fan","t":"showcase","g":"#0B0B0D","p":"ref-spectrum","sw":["#0B0B0D","#F4F6F8","#FF375F","#FFD60A"]},{"id":"bonus-fan-2","n":"Fan · Sky Arcs 2","c":"Sky Arcs","l":"fan","t":"showcase","g":"#BCDCEA","p":"ref-sky","sw":["#BCDCEA","#10303D","#B84AC8","#F2842C"]},{"id":"bonus-fan-3","n":"Fan · Mint Room 3","c":"Mint Room","l":"fan","t":"showcase","g":"#A8DCD5","p":"ref-mint","sw":["#A8DCD5","#123833","#F4C83C","#5B4BC4"]},{"id":"bonus-fan-4","n":"Fan · Poly Grey 4","c":"Poly Grey","l":"fan","t":"showcase","g":"#E8E8EA","p":"ref-poly","sw":["#E8E8EA","#1A1A1E","#B08CF5","#2FBF4A"]},{"id":"bonus-cascade-1","n":"Cascade · Spectrum 1","c":"Spectrum","l":"cascade","t":"showcase","g":"#0B0B0D","p":"ref-spectrum","sw":["#0B0B0D","#F4F6F8","#FF375F","#FFD60A"]},{"id":"bonus-cascade-2","n":"Cascade · Sky Arcs 2","c":"Sky Arcs","l":"cascade","t":"showcase","g":"#BCDCEA","p":"ref-sky","sw":["#BCDCEA","#10303D","#B84AC8","#F2842C"]},{"id":"bonus-cascade-3","n":"Cascade · Mint Room 3","c":"Mint Room","l":"cascade","t":"showcase","g":"#A8DCD5","p":"ref-mint","sw":["#A8DCD5","#123833","#F4C83C","#5B4BC4"]},{"id":"bonus-cascade-4","n":"Cascade · Poly Grey 4","c":"Poly Grey","l":"cascade","t":"showcase","g":"#E8E8EA","p":"ref-poly","sw":["#E8E8EA","#1A1A1E","#B08CF5","#2FBF4A"]},{"id":"bonus-orbit-1","n":"Orbit · Spectrum 1","c":"Spectrum","l":"orbit","t":"showcase","g":"#0B0B0D","p":"ref-spectrum","sw":["#0B0B0D","#F4F6F8","#FF375F","#FFD60A"]},{"id":"bonus-orbit-2","n":"Orbit · Sky Arcs 2","c":"Sky Arcs","l":"orbit","t":"showcase","g":"#BCDCEA","p":"ref-sky","sw":["#BCDCEA","#10303D","#B84AC8","#F2842C"]},{"id":"bonus-orbit-3","n":"Orbit · Mint Room 3","c":"Mint Room","l":"orbit","t":"showcase","g":"#A8DCD5","p":"ref-mint","sw":["#A8DCD5","#123833","#F4C83C","#5B4BC4"]},{"id":"bonus-orbit-4","n":"Orbit · Poly Grey 4","c":"Poly Grey","l":"orbit","t":"showcase","g":"#E8E8EA","p":"ref-poly","sw":["#E8E8EA","#1A1A1E","#B08CF5","#2FBF4A"]},{"id":"bonus-column-1","n":"Column · Spectrum 1","c":"Spectrum","l":"column","t":"showcase","g":"#0B0B0D","p":"ref-spectrum","sw":["#0B0B0D","#F4F6F8","#FF375F","#FFD60A"]},{"id":"bonus-column-2","n":"Column · Sky Arcs 2","c":"Sky Arcs","l":"column","t":"showcase","g":"#BCDCEA","p":"ref-sky","sw":["#BCDCEA","#10303D","#B84AC8","#F2842C"]},{"id":"bonus-column-3","n":"Column · Mint Room 3","c":"Mint Room","l":"column","t":"showcase","g":"#A8DCD5","p":"ref-mint","sw":["#A8DCD5","#123833","#F4C83C","#5B4BC4"]},{"id":"bonus-column-4","n":"Column · Poly Grey 4","c":"Poly Grey","l":"column","t":"showcase","g":"#E8E8EA","p":"ref-poly","sw":["#E8E8EA","#1A1A1E","#B08CF5","#2FBF4A"]}];
const KEY = 'lab-set9';
let st = { on:{}, seen:{}, hist:[], mode:'grid' };
try { const s = JSON.parse(localStorage.getItem(KEY) || 'null'); if (s && s.on) st = Object.assign(st, s); } catch(e){}

/* SAVE OFTEN AND ON THE WAY OUT. A phone can discard this tab at any moment;
   anything not written down when that happens is a grade the owner has to redo. */
let dirty = false;
const write = () => { try { localStorage.setItem(KEY, JSON.stringify(st)); dirty = false;
    const s = document.getElementById('saved'); if (s){ s.textContent = 'saved'; setTimeout(() => s.textContent = '', 1200); }
  } catch(e){} };
const save = () => { dirty = true; write(); };
addEventListener('pagehide', () => { if (dirty) write(); });
addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden' && dirty) write(); });
addEventListener('beforeunload', () => { if (dirty) write(); });

const $ = id => document.getElementById(id);
$('ntot').textContent = CARDS.length;

function count(){
  const seen = Object.keys(st.seen).length, kept = Object.keys(st.on).length;
  $('nseen').textContent = seen; $('nkept').textContent = kept;
  $('bar').style.width = (seen / CARDS.length * 100) + '%';
}

function tile(c){
  const d = document.createElement('article');
  d.className = 'card' + (st.on[c.id] ? ' on' : '');
  d.innerHTML = '<div class="tick">&#10003;</div>'
    + '<img src="set9/' + c.id + '.webp" alt="' + c.n + '" loading="lazy" decoding="async" width="448" height="448">'
    + '<div class="meta"><span class="nm"></span><span class="sub2"></span>'
    + '<span class="sw">' + (c.sw || []).map(h => '<i style="background:' + h + '"></i>').join('') + '</span>'
    + '<span class="mono" style="font-size:10px"></span></div>';
  d.querySelector('.nm').textContent = c.n;
  d.querySelector('.sub2').textContent = [c.c, c.l, c.t, c.g].filter(Boolean).join(' · ');
  d.querySelector('.mono').textContent = c.id;
  d.onclick = () => {
    if (st.on[c.id]) delete st.on[c.id]; else st.on[c.id] = 1;
    st.seen[c.id] = 1; save(); d.classList.toggle('on', !!st.on[c.id]); count();
  };
  return d;
}

function renderGrid(){
  const g = $('grid'); g.innerHTML = '';
  const frag = document.createDocumentFragment();
  CARDS.forEach(c => frag.appendChild(tile(c)));
  g.appendChild(frag); count();
}

/* ---- the deck ---- */
const nextIdx = () => CARDS.findIndex(c => !st.seen[c.id]);
/* ZOOM. The grid is sized from one custom property, so the tiles grow without
   the page reflowing anything else, and the choice is remembered — a set of a
   hundred is worked through over more than one sitting. */
const ZSTEPS=[130,160,190,240,300,380,480,620,820];
let zi=ZSTEPS.indexOf(+(localStorage.getItem('lab-tile')||190));
if(zi<0)zi=2;
function applyZoom(){
  const px=ZSTEPS[zi];
  document.documentElement.style.setProperty('--tile',px+'px');
  const l=document.getElementById('zlabel'); if(l)l.textContent=px;
  try{localStorage.setItem('lab-tile',px)}catch(e){}
  document.getElementById('zout').disabled=zi<=0;
  document.getElementById('zin').disabled=zi>=ZSTEPS.length-1;
}
document.getElementById('zin').onclick=()=>{if(zi<ZSTEPS.length-1){zi++;applyZoom()}};
document.getElementById('zout').onclick=()=>{if(zi>0){zi--;applyZoom()}};
addEventListener('keydown',e=>{
  if(/^(INPUT|TEXTAREA)$/.test(e.target.tagName))return;
  if(e.key==='+'||e.key==='='){if(zi<ZSTEPS.length-1){zi++;applyZoom()}e.preventDefault();}
  if(e.key==='-'||e.key==='_'){if(zi>0){zi--;applyZoom()}e.preventDefault();}
});
applyZoom();

function renderDeck(){
  const stage = $('stage'); stage.innerHTML = ''; count();
  const i = nextIdx();
  if (i < 0){ stage.innerHTML = '<div class="fin">Every card graded. Export the list, or press Undo to step back.</div>'; $('dmeta').textContent = ''; return; }
  const c = CARDS[i], n = CARDS[i + 1];
  const mk = (cc, under) => {
    const d = document.createElement('div'); d.className = 'sc' + (under ? ' under' : '');
    d.innerHTML = '<img src="set9/' + cc.id + '.webp" alt="" decoding="async">'
      + '<span class="stamp keep">KEEP</span><span class="stamp pass">PASS</span>';
    return d;
  };
  if (n) stage.appendChild(mk(n, true));
  const top = stage.appendChild(mk(c, false));
  $('dmeta').textContent = [c.n, c.c, c.l, c.t, c.g, c.id].filter(Boolean).join('  ·  ');
  let x0 = 0, dx = 0, on = false;
  const setX = (x, anim) => { top.classList.toggle('anim', !!anim);
    top.style.transform = 'translateX(' + x + 'px) rotate(' + (x / 20) + 'deg)';
    top.querySelector('.keep').style.opacity = Math.min(1, Math.max(0, x / 90));
    top.querySelector('.pass').style.opacity = Math.min(1, Math.max(0, -x / 90)); };
  const down = e => { on = true; x0 = (e.touches ? e.touches[0].clientX : e.clientX); dx = 0; top.classList.remove('anim'); };
  const move = e => { if (!on) return; dx = (e.touches ? e.touches[0].clientX : e.clientX) - x0; setX(dx, false); };
  const up = () => { if (!on) return; on = false; if (dx > 85) decide(1); else if (dx < -85) decide(0); else setX(0, true); };
  top.addEventListener('touchstart', down, { passive:true }); top.addEventListener('touchmove', move, { passive:true }); top.addEventListener('touchend', up);
  top.addEventListener('mousedown', down); addEventListener('mousemove', move); addEventListener('mouseup', up);
  top.__fly = d2 => { setX(d2 * innerWidth, true); top.style.opacity = '0'; };
}
function decide(keep){
  const i = nextIdx(); if (i < 0) return;
  const c = CARDS[i], top = $('stage').querySelector('.sc:not(.under)');
  if (top && top.__fly) top.__fly(keep ? 1 : -1);
  st.seen[c.id] = 1; if (keep) st.on[c.id] = 1; else delete st.on[c.id];
  st.hist.push(c.id); if (st.hist.length > 600) st.hist.shift();
  save(); setTimeout(renderDeck, 230);
}
function undo(){ const id = st.hist.pop(); if (!id) return; delete st.seen[id]; delete st.on[id]; save(); renderDeck(); }

function setMode(m){
  st.mode = m; save();
  const deck = m === 'deck';
  $('deck').style.display = deck ? 'flex' : 'none';
  $('grid').style.display = deck ? 'none' : 'grid';
  $('mode').textContent = deck ? 'Grid' : 'Deck';
  if (deck) renderDeck(); else renderGrid();
}
$('no').onclick = () => decide(0); $('yes').onclick = () => decide(1); $('undo').onclick = undo;
$('mode').onclick = () => setMode(st.mode === 'deck' ? 'grid' : 'deck');
$('reset').onclick = () => { if (!confirm('Clear every grade for this set?')) return; st = { on:{}, seen:{}, hist:[], mode: st.mode }; save(); setMode(st.mode); };
$('export').onclick = () => {
  const kept = CARDS.filter(c => st.on[c.id]);
  $('outtext').value = kept.length ? kept.map(c => c.id + '  ' + c.n + ' · ' + c.c + ' · ' + c.l + ' · ' + c.t).join('\n') : 'Nothing kept yet.';
  $('out').showModal();
};
$('close').onclick = () => $('out').close();
$('copy').onclick = async () => {
  try { await navigator.clipboard.writeText($('outtext').value); $('copy').textContent = 'Copied'; }
  catch(e){ $('outtext').select(); $('copy').textContent = 'Select and copy'; }
  setTimeout(() => $('copy').textContent = 'Copy', 1500);
};
addEventListener('keydown', e => {
  if (st.mode !== 'deck' || $('out').open) return;
  if (e.key === '1' || e.key === 'ArrowLeft'){ e.preventDefault(); decide(0); }
  else if (e.key === '2' || e.key === 'ArrowRight'){ e.preventDefault(); decide(1); }
  else if (e.key === 'Backspace'){ e.preventDefault(); undo(); }
});
setMode(st.mode || 'grid');
