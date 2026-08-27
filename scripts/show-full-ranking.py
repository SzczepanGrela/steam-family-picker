#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import sqlite3
import os
import sys

def main():
    possible_paths = [
        os.path.join(os.getcwd(), 'data', 'steam_family.db'),
        '/app/data/steam_family.db',
        'data/steam_family.db',
        '../data/steam_family.db',
    ]
    
    db_path = None
    for p in possible_paths:
        if os.path.exists(p):
            db_path = p
            break
            
    if not db_path:
        print("Nie znaleziono pliku bazy danych steam_family.db")
        sys.exit(1)

    conn = sqlite3.connect(db_path)
    cur = conn.cursor()

    # 1. Accounts
    cur.execute("SELECT steam_id, persona_name, shareable_games FROM accounts WHERE is_submitted = 1")
    accounts = cur.fetchall()

    if not accounts:
        print("Brak zgłoszonych kont w bazie.")
        sys.exit(0)

    # 2. Game Demand
    cur.execute("""
        SELECT up.app_id, SUM(up.score) 
        FROM user_preferences up 
        JOIN ballot_submissions bs ON up.voter_steam_id = bs.voter_steam_id 
        WHERE up.score > 0 
        GROUP BY up.app_id
    """)
    game_demand = {row[0]: row[1] for row in cur.fetchall()}

    # 3. TierMaker direct ranking points (Normalized Mid-Rank Borda)
    cur.execute("""
        SELECT ap.voter_steam_id, ap.target_steam_id, ap.tier 
        FROM account_preferences ap 
        JOIN ballot_submissions bs ON ap.voter_steam_id = bs.voter_steam_id
    """)
    all_prefs = cur.fetchall()
    
    prefs_by_voter = {}
    for voter_id, target_id, tier in all_prefs:
        if voter_id not in prefs_by_voter:
            prefs_by_voter[voter_id] = []
        prefs_by_voter[voter_id].append((target_id, tier))

    direct_points = {acc[0]: 0 for acc in accounts}
    for voter_id, prefs in prefs_by_voter.items():
        candidates = [p for p in prefs if p[0] != voter_id]
        k = len(candidates)
        if k == 0:
            continue
        
        tier_groups = {}
        for target_id, tier in candidates:
            if tier not in tier_groups:
                tier_groups[tier] = []
            tier_groups[tier].append(target_id)
            
        current_rank = 1
        for tier in sorted(tier_groups.keys(), reverse=True):
            group = tier_groups[tier]
            mid_rank = current_rank + (len(group) - 1) / 2.0
            borda = round(((k - mid_rank) / (k - 1)) * 100) if k > 1 else 100
            for target_id in group:
                if target_id in direct_points:
                    direct_points[target_id] += borda
            current_rank += len(group)

    # 4. Calculate for each account
    results = []
    for steam_id, persona_name, shareable_games in accounts:
        cur.execute("SELECT app_id FROM account_games WHERE steam_id = ?", (steam_id,))
        acc_games = cur.fetchall()
        
        g_points = sum(game_demand.get(g[0], 0) for g in acc_games)
        d_points = direct_points.get(steam_id, 0)
        total = d_points + g_points
        
        results.append({
            'name': persona_name,
            'total': total,
            'direct': d_points,
            'game': g_points,
            'share': shareable_games or 0
        })

    results.sort(key=lambda x: (x['total'], x['share']), reverse=True)

    print("\n" + "=" * 76)
    print("🏆 PEŁNY OFICJALNY RANKING WSZYSTKICH KONT:")
    print("=" * 76)
    print(f"{'Msc':<5} | {'Nick gracza':<22} | {'Suma Pkt':<9} | {'Z rankingów':<12} | {'Z gier':<8} | {'Gry Share':<9}")
    print("-" * 76)
    
    for i, r in enumerate(results, 1):
        msc_label = f"#{i}"
        if i == 1: msc_label = "🥇 #1"
        elif i == 2: msc_label = "🥈 #2"
        elif i == 3: msc_label = "🥉 #3"
        print(f"{msc_label:<5} | {r['name'][:22]:<22} | {r['total']:<9} | {r['direct']:<12} | {r['game']:<8} | {r['share']:<9}")

    print("-" * 76)
    print(f"Łącznie sklasyfikowano: {len(results)} kont.\n")
    conn.close()

if __name__ == '__main__':
    main()
